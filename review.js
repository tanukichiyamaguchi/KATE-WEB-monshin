/**
 * KATEstageLASH Review Form
 * Main JavaScript File
 */

// ============================================
// Configuration
// ============================================

const CONFIG = {
    // Google Apps Script Web App URL for saving review data
    GOOGLE_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',

    // OpenAI API endpoint (via proxy or direct)
    // Replace with your API endpoint
    AI_API_URL: 'YOUR_AI_API_ENDPOINT_HERE',
    AI_API_KEY: 'YOUR_API_KEY_HERE',

    // Google Review URL
    GOOGLE_REVIEW_URL: 'https://g.page/r/CawIWPvYFL2vEBM/review',

    // Salon information
    SALON_NAME: 'KATEstageLASH 蒲田西口店',
    SALON_TYPE: '眉毛まつ毛サロン'
};

// ============================================
// State Management
// ============================================

const state = {
    ratings: {
        overall: 0,
        technique: 0,
        service: 0,
        design: 0,
        atmosphere: 0,
        cleanliness: 0,
        price: 0
    },
    selectedMenus: [],
    generatedReview: '',
    isGenerating: false
};

// ============================================
// DOM Elements
// ============================================

const elements = {
    form: document.getElementById('reviewForm'),
    generateBtn: document.getElementById('generateReviewBtn'),
    reviewSection: document.getElementById('reviewSection'),
    reviewLoading: document.getElementById('reviewLoading'),
    reviewTextGroup: document.getElementById('reviewTextGroup'),
    reviewText: document.getElementById('reviewText'),
    charCount: document.getElementById('charCount'),
    actionButtons: document.getElementById('actionButtons'),
    regenerateBtn: document.getElementById('regenerateBtn'),
    copyBtn: document.getElementById('copyBtn'),
    copySuccess: document.getElementById('copySuccess'),
    googleReviewContainer: document.getElementById('googleReviewContainer'),
    googleReviewBtn: document.getElementById('googleReviewBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toast: document.getElementById('toast')
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeStarRatings();
    initializeMenuCheckboxes();
    initializeGenerateButton();
    initializeActionButtons();
    initializeTextareaCounter();
});

// ============================================
// Star Rating System
// ============================================

function initializeStarRatings() {
    const ratingGroups = document.querySelectorAll('.star-rating');

    ratingGroups.forEach(group => {
        const ratingType = group.dataset.rating;
        const stars = group.querySelectorAll('.star');
        const hiddenInput = group.querySelector('input[type="hidden"]');

        stars.forEach(star => {
            // Click handler
            star.addEventListener('click', function() {
                const value = parseInt(this.dataset.value);
                setRating(group, ratingType, value, hiddenInput);
            });

            // Hover handlers
            star.addEventListener('mouseenter', function() {
                const value = parseInt(this.dataset.value);
                highlightStars(stars, value);
            });

            star.addEventListener('mouseleave', function() {
                resetStars(stars, state.ratings[ratingType]);
            });

            // Touch handler for mobile
            star.addEventListener('touchend', function(e) {
                e.preventDefault();
                const value = parseInt(this.dataset.value);
                setRating(group, ratingType, value, hiddenInput);
            });
        });
    });
}

function setRating(group, ratingType, value, hiddenInput) {
    state.ratings[ratingType] = value;
    hiddenInput.value = value;

    const stars = group.querySelectorAll('.star');
    resetStars(stars, value);

    // Add rated class to parent
    const ratingGroup = group.closest('.rating-group');
    if (ratingGroup) {
        ratingGroup.classList.add('rated');
    }

    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }
}

function highlightStars(stars, upToValue) {
    stars.forEach(star => {
        const starValue = parseInt(star.dataset.value);
        if (starValue <= upToValue) {
            star.classList.add('hover');
        } else {
            star.classList.remove('hover');
        }
    });
}

function resetStars(stars, currentValue) {
    stars.forEach(star => {
        const starValue = parseInt(star.dataset.value);
        star.classList.remove('hover');
        if (starValue <= currentValue) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// ============================================
// Menu Checkboxes
// ============================================

function initializeMenuCheckboxes() {
    const checkboxes = document.querySelectorAll('input[name="menu"]');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!state.selectedMenus.includes(this.value)) {
                    state.selectedMenus.push(this.value);
                }
            } else {
                const index = state.selectedMenus.indexOf(this.value);
                if (index > -1) {
                    state.selectedMenus.splice(index, 1);
                }
            }
        });
    });
}

// ============================================
// Generate Review Button
// ============================================

function initializeGenerateButton() {
    elements.generateBtn.addEventListener('click', async function() {
        // Validate at least overall rating is provided
        if (state.ratings.overall === 0) {
            showToast('総合満足度を選択してください');
            return;
        }

        await generateReview();
    });
}

async function generateReview() {
    if (state.isGenerating) return;

    state.isGenerating = true;
    elements.generateBtn.disabled = true;

    // Show review section with loading state
    elements.reviewSection.style.display = 'block';
    elements.reviewLoading.style.display = 'flex';
    elements.reviewTextGroup.style.display = 'none';
    elements.actionButtons.style.display = 'none';
    elements.copySuccess.style.display = 'none';
    elements.googleReviewContainer.style.display = 'none';

    // Scroll to review section
    elements.reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        // Try to use AI API if configured
        let reviewText = '';

        if (CONFIG.AI_API_KEY && CONFIG.AI_API_KEY !== 'YOUR_API_KEY_HERE') {
            reviewText = await generateReviewWithAI();
        } else {
            // Fallback to template-based generation
            reviewText = generateReviewTemplate();
        }

        state.generatedReview = reviewText;
        elements.reviewText.value = reviewText;
        updateCharCount();

        // Show review text area and buttons
        elements.reviewLoading.style.display = 'none';
        elements.reviewTextGroup.style.display = 'block';
        elements.actionButtons.style.display = 'flex';
        elements.googleReviewContainer.style.display = 'block';

    } catch (error) {
        console.error('Error generating review:', error);
        // Fallback to template
        const reviewText = generateReviewTemplate();
        state.generatedReview = reviewText;
        elements.reviewText.value = reviewText;
        updateCharCount();

        elements.reviewLoading.style.display = 'none';
        elements.reviewTextGroup.style.display = 'block';
        elements.actionButtons.style.display = 'flex';
        elements.googleReviewContainer.style.display = 'block';
    }

    state.isGenerating = false;
    elements.generateBtn.disabled = false;
}

async function generateReviewWithAI() {
    const prompt = createAIPrompt();

    const response = await fetch(CONFIG.AI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.AI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `あなたは${CONFIG.SALON_NAME}（${CONFIG.SALON_TYPE}）に来店したお客様です。実際に施術を受けた感想として、自然で温かみのある口コミを書いてください。以下のガイドラインに従ってください：
                    - 200〜400文字程度
                    - 敬語で丁寧に
                    - 具体的な体験を含める
                    - 過度に広告的にならない
                    - 自然な日本語で
                    - 絵文字は使わない`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        })
    });

    if (!response.ok) {
        throw new Error('AI API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

function createAIPrompt() {
    const ratingDescriptions = {
        5: '非常に満足',
        4: '満足',
        3: '普通',
        2: '少し不満',
        1: '不満'
    };

    let prompt = `以下の評価をもとに、${CONFIG.SALON_NAME}の口コミを書いてください。\n\n`;

    prompt += `【評価】\n`;
    prompt += `総合満足度: ${state.ratings.overall}点（${ratingDescriptions[state.ratings.overall] || '未評価'}）\n`;

    if (state.ratings.technique > 0) {
        prompt += `施術の技術: ${state.ratings.technique}点\n`;
    }
    if (state.ratings.service > 0) {
        prompt += `スタッフの接客: ${state.ratings.service}点\n`;
    }
    if (state.ratings.design > 0) {
        prompt += `仕上がり・デザイン: ${state.ratings.design}点\n`;
    }
    if (state.ratings.atmosphere > 0) {
        prompt += `店内の雰囲気: ${state.ratings.atmosphere}点\n`;
    }
    if (state.ratings.cleanliness > 0) {
        prompt += `清潔感: ${state.ratings.cleanliness}点\n`;
    }
    if (state.ratings.price > 0) {
        prompt += `価格の満足度: ${state.ratings.price}点\n`;
    }

    if (state.selectedMenus.length > 0) {
        prompt += `\n【利用メニュー】\n${state.selectedMenus.join('、')}\n`;
    }

    prompt += `\n上記の評価に基づいて、自然な口コミ文を作成してください。`;

    return prompt;
}

function generateReviewTemplate() {
    const rating = state.ratings.overall;
    const menus = state.selectedMenus.length > 0 ? state.selectedMenus.join('と') : 'まつげパーマ';

    // Templates based on overall rating
    const templates = {
        5: [
            `初めて${menus}をお願いしました。カウンセリングがとても丁寧で、私の希望をしっかり聞いてくださいました。仕上がりも想像以上に綺麗で、とても満足しています。スタッフの方の技術力の高さを感じました。店内も清潔感があり、リラックスして施術を受けることができました。また次回もお願いしたいと思います。`,
            `友人の紹介で来店しました。${menus}を受けましたが、とても丁寧に施術していただきました。仕上がりがとても自然で、目元が華やかになりました。スタッフの方も親切で、色々と相談に乗ってくださいました。店内の雰囲気も落ち着いていて、ゆったりとした時間を過ごせました。リピート決定です！`,
            `${menus}で伺いました。技術がとても高く、細かい要望にも応えていただけました。施術中の説明も丁寧で、安心してお任せできました。仕上がりにとても満足しています。接客も素晴らしく、また来たいと思えるサロンでした。ありがとうございました。`
        ],
        4: [
            `${menus}を受けてきました。仕上がりはとても綺麗で満足しています。スタッフの方も丁寧に対応してくださいました。店内も清潔感があり、落ち着いた雰囲気でした。また機会があれば利用したいと思います。`,
            `初めての来店でしたが、カウンセリングが丁寧で安心できました。${menus}の仕上がりも良く、目元が明るくなりました。スタッフの方の技術も確かだと感じました。また利用させていただきたいと思います。`,
            `${menus}でお世話になりました。希望通りの仕上がりにしていただけて嬉しかったです。接客も丁寧で、居心地の良いサロンでした。次回もお願いしたいと思います。`
        ],
        3: [
            `${menus}を受けました。仕上がりは概ね満足できる内容でした。スタッフの方も丁寧に対応してくださいました。次回も検討したいと思います。`,
            `初めて伺いました。${menus}をお願いしましたが、普通に良かったです。特に問題はなく、またの機会があれば利用するかもしれません。`,
            `${menus}で来店しました。可もなく不可もなくといった印象です。スタッフの方は感じが良かったです。`
        ],
        2: [
            `${menus}を受けましたが、期待していたほどではありませんでした。もう少し細かい相談ができればよかったかなと思います。`,
            `${menus}で伺いました。仕上がりがイメージと少し違っていました。事前のカウンセリングでもう少し確認すればよかったと思います。`
        ],
        1: [
            `${menus}を受けましたが、残念ながら期待通りではありませんでした。今後の改善を期待しています。`
        ]
    };

    // Get templates for the rating (fallback to rating 3 if not found)
    const ratingTemplates = templates[rating] || templates[3];

    // Randomly select a template
    const randomIndex = Math.floor(Math.random() * ratingTemplates.length);
    return ratingTemplates[randomIndex];
}

// ============================================
// Action Buttons
// ============================================

function initializeActionButtons() {
    // Regenerate button
    elements.regenerateBtn.addEventListener('click', async function() {
        await generateReview();
    });

    // Copy button
    elements.copyBtn.addEventListener('click', function() {
        copyReviewText();
    });
}

async function copyReviewText() {
    const text = elements.reviewText.value;

    try {
        await navigator.clipboard.writeText(text);

        // Show success message
        elements.copySuccess.style.display = 'flex';

        // Hide after 3 seconds
        setTimeout(() => {
            elements.copySuccess.style.display = 'none';
        }, 3000);

        // Save to spreadsheet
        saveReviewData();

    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            elements.copySuccess.style.display = 'flex';
            setTimeout(() => {
                elements.copySuccess.style.display = 'none';
            }, 3000);
            saveReviewData();
        } catch (err) {
            showToast('コピーに失敗しました');
        }

        document.body.removeChild(textArea);
    }
}

// ============================================
// Textarea Counter
// ============================================

function initializeTextareaCounter() {
    elements.reviewText.addEventListener('input', updateCharCount);
}

function updateCharCount() {
    const count = elements.reviewText.value.length;
    elements.charCount.textContent = count;
}

// ============================================
// Save to Spreadsheet
// ============================================

async function saveReviewData() {
    if (CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        console.log('Google Script URL not configured, skipping save');
        return;
    }

    const data = {
        timestamp: new Date().toISOString(),
        ratings: state.ratings,
        menus: state.selectedMenus.join(', '),
        reviewText: elements.reviewText.value,
        averageRating: calculateAverageRating()
    };

    try {
        await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        console.log('Review data saved successfully');
    } catch (error) {
        console.error('Error saving review data:', error);
    }
}

function calculateAverageRating() {
    const ratings = Object.values(state.ratings).filter(r => r > 0);
    if (ratings.length === 0) return 0;
    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
}

// ============================================
// Toast Notification
// ============================================

function showToast(message, duration = 3000) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, duration);
}

// ============================================
// Utility Functions
// ============================================

// Prevent double-tap zoom on iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Handle visibility change (pause/resume)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden, save state if needed
    } else {
        // Page is visible again
    }
});
