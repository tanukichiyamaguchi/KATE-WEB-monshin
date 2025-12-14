/**
 * KATEstageLASH Web Questionnaire
 * Main JavaScript File
 */

// ============================================
// Configuration
// ============================================

const CONFIG = {
    // Google Apps Script Web App URL - Replace with your deployed script URL
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwrR3VkHiWQQNhGlMfOBgysnBBM5jbpKEly0Ta9cT_vKYvcEscWKEjbk9wcUdhfLljvAA/exec',

    // Total number of sections (reduced from 10 to 6)
    TOTAL_SECTIONS: 6,

    // Date picker range
    BIRTH_YEAR_START: 1940,
    BIRTH_YEAR_END: new Date().getFullYear() - 10
};

// ============================================
// State Management
// ============================================

let currentSection = 1;

// ============================================
// DOM Elements
// ============================================

const elements = {
    form: document.getElementById('questionnaireForm'),
    progressFill: document.getElementById('progressFill'),
    currentSectionText: document.getElementById('currentSection'),
    totalSectionsText: document.getElementById('totalSections'),
    submitBtn: document.getElementById('submitBtn'),
    confirmationModal: document.getElementById('confirmationModal'),
    confirmationContent: document.getElementById('confirmationContent'),
    editBtn: document.getElementById('editBtn'),
    confirmSubmitBtn: document.getElementById('confirmSubmitBtn'),
    successModal: document.getElementById('successModal'),
    couponModal: document.getElementById('couponModal'),
    closeCouponBtn: document.getElementById('closeCouponBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    currentDateInput: document.getElementById('currentDate')
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeDatePickers();
    initializePhoneInput();
    initializeConditionalFields();
    initializeNavigationButtons();
    initializeCurrentDate();
    initializeSubmitButton();
    initializeModalButtons();
    initializeAutoScroll();
    initializeInputHighlight();
    initializeSectionComplete();
    updateProgress();
});

// ============================================
// Date Picker Initialization
// ============================================

function initializeDatePickers() {
    const yearSelect = document.querySelector('select[name="birthYear"]');
    const monthSelect = document.querySelector('select[name="birthMonth"]');
    const daySelect = document.querySelector('select[name="birthDay"]');

    // Populate years
    for (let year = CONFIG.BIRTH_YEAR_END; year >= CONFIG.BIRTH_YEAR_START; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + '年';
        yearSelect.appendChild(option);
    }

    // Populate months
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month + '月';
        monthSelect.appendChild(option);
    }

    // Populate days
    for (let day = 1; day <= 31; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day + '日';
        daySelect.appendChild(option);
    }

    // Update days when year or month changes
    yearSelect.addEventListener('change', updateDays);
    monthSelect.addEventListener('change', updateDays);
}

function updateDays() {
    const yearSelect = document.querySelector('select[name="birthYear"]');
    const monthSelect = document.querySelector('select[name="birthMonth"]');
    const daySelect = document.querySelector('select[name="birthDay"]');

    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);

    if (year && month) {
        const daysInMonth = new Date(year, month, 0).getDate();
        const currentDay = parseInt(daySelect.value);

        // Clear and repopulate days
        daySelect.innerHTML = '<option value="">日</option>';
        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day + '日';
            if (day === currentDay) option.selected = true;
            daySelect.appendChild(option);
        }
    }
}

// ============================================
// Phone Input Formatting
// ============================================

function initializePhoneInput() {
    const phoneInput = document.querySelector('input[name="phone"]');

    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 11) {
            value = value.slice(0, 11);
        }

        // Format: 090-1234-5678
        if (value.length >= 4 && value.length <= 7) {
            value = value.slice(0, 3) + '-' + value.slice(3);
        } else if (value.length > 7) {
            value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
        }

        e.target.value = value;
    });
}

// ============================================
// Conditional Fields
// ============================================

function initializeConditionalFields() {
    // Handle checkbox toggles
    document.querySelectorAll('input[type="checkbox"][data-toggle]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const targetId = this.dataset.toggle;
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.style.display = this.checked ? 'block' : 'none';

                // Clear inputs when hidden
                if (!this.checked) {
                    clearFieldInputs(targetElement);
                }
            }
        });
    });

    // Handle radio toggles
    document.querySelectorAll('input[type="radio"][data-toggle]').forEach(radio => {
        const radioGroup = document.querySelectorAll(`input[type="radio"][name="${radio.name}"]`);

        radioGroup.forEach(r => {
            r.addEventListener('change', function() {
                // Hide all toggleable elements for this group
                radioGroup.forEach(item => {
                    if (item.dataset.toggle) {
                        const target = document.getElementById(item.dataset.toggle);
                        if (target) {
                            target.style.display = 'none';
                            clearFieldInputs(target);
                        }
                    }
                });

                // Show the selected one
                if (this.dataset.toggle && this.checked) {
                    const target = document.getElementById(this.dataset.toggle);
                    if (target) {
                        target.style.display = 'block';
                    }
                }
            });
        });
    });

    // Special handling for review choice -> show note
    const reviewRadios = document.querySelectorAll('input[name="reviewChoice"]');
    reviewRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const reviewNoteField = document.getElementById('reviewNote');
            if (reviewNoteField) {
                if (this.value === '口コミする') {
                    reviewNoteField.style.display = 'block';
                } else {
                    reviewNoteField.style.display = 'none';
                }
            }
        });
    });
}

function clearFieldInputs(element) {
    element.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
}

// ============================================
// Auto Scroll for Single Selection (Radio)
// ============================================

function initializeAutoScroll() {
    // Add auto-scroll for radio buttons (single selection)
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            // Don't scroll if this is in a conditional field that just appeared
            const formGroup = this.closest('.form-group');
            if (formGroup && formGroup.classList.contains('conditional-field')) {
                return;
            }

            // Find the next form-group element
            const currentFormGroup = this.closest('.form-group');
            if (currentFormGroup) {
                const nextFormGroup = currentFormGroup.nextElementSibling;

                // Skip conditional fields that are hidden
                let targetElement = nextFormGroup;
                while (targetElement &&
                       targetElement.classList.contains('conditional-field') &&
                       targetElement.style.display === 'none') {
                    targetElement = targetElement.nextElementSibling;
                }

                if (targetElement && !targetElement.classList.contains('button-group')) {
                    // Delay scroll slightly for better UX
                    setTimeout(() => {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }, 150);
                }
            }

            // Update highlight after selection
            setTimeout(() => {
                updateInputHighlight();
                checkSectionComplete();
            }, 200);
        });
    });
}

// ============================================
// Input Highlight (Next field to fill)
// ============================================

function initializeInputHighlight() {
    // Add change listeners to all form inputs
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', function() {
            setTimeout(() => {
                updateInputHighlight();
                checkSectionComplete();
            }, 100);
        });
        input.addEventListener('input', function() {
            setTimeout(() => {
                updateInputHighlight();
                checkSectionComplete();
            }, 100);
        });
    });

    // Initial highlight
    setTimeout(updateInputHighlight, 500);
}

function updateInputHighlight() {
    const section = document.querySelector(`.form-section[data-section="${currentSection}"]`);
    if (!section) return;

    // Remove all existing highlights
    document.querySelectorAll('.form-group.next-input').forEach(group => {
        group.classList.remove('next-input');
    });

    // Find the first unfilled required field
    const formGroups = section.querySelectorAll('.form-group:not(.conditional-field), .form-group.conditional-field[style*="block"]');

    for (const group of formGroups) {
        if (group.classList.contains('button-group')) continue;

        const isComplete = isFormGroupComplete(group);

        if (!isComplete) {
            group.classList.add('next-input');
            break;
        }
    }
}

function isFormGroupComplete(group) {
    // Check text inputs
    const textInput = group.querySelector('input[type="text"][required], input[type="email"][required], input[type="tel"][required]');
    if (textInput && !textInput.value.trim()) return false;

    // Check selects
    const selects = group.querySelectorAll('select[required]');
    for (const select of selects) {
        if (!select.value) return false;
    }

    // Check radio buttons
    const radioName = group.querySelector('input[type="radio"][required]');
    if (radioName) {
        const checked = group.querySelector(`input[type="radio"][name="${radioName.name}"]:checked`);
        if (!checked) return false;
    }

    // Check checkbox groups (at least one should be checked if it's a required group)
    const checkboxes = group.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) {
        // Check if this is a consent box (all must be checked)
        const consentBox = group.querySelector('.consent-box');
        if (consentBox) {
            const requiredCheckboxes = group.querySelectorAll('input[type="checkbox"][required]');
            for (const cb of requiredCheckboxes) {
                if (!cb.checked) return false;
            }
        } else {
            // Regular checkbox group - at least one must be checked
            const hasLabel = group.querySelector('.form-label.required');
            if (hasLabel) {
                const anyChecked = group.querySelector('input[type="checkbox"]:checked');
                if (!anyChecked) return false;
            }
        }
    }

    return true;
}

// ============================================
// Section Complete Check (Button emphasis)
// ============================================

function initializeSectionComplete() {
    // Initial check
    setTimeout(checkSectionComplete, 500);
}

function checkSectionComplete() {
    const section = document.querySelector(`.form-section[data-section="${currentSection}"]`);
    if (!section) return;

    const buttonGroup = section.querySelector('.button-group');
    if (!buttonGroup) return;

    // Check if all form groups are complete
    const formGroups = section.querySelectorAll('.form-group:not(.conditional-field):not(.button-group)');
    let allComplete = true;

    for (const group of formGroups) {
        if (!isFormGroupComplete(group)) {
            allComplete = false;
            break;
        }
    }

    // Also check visible conditional fields
    const visibleConditionalFields = section.querySelectorAll('.form-group.conditional-field[style*="block"]');
    for (const group of visibleConditionalFields) {
        if (!isFormGroupComplete(group)) {
            allComplete = false;
            break;
        }
    }

    if (allComplete) {
        buttonGroup.classList.add('section-complete');
    } else {
        buttonGroup.classList.remove('section-complete');
    }
}

// ============================================
// Navigation
// ============================================

function initializeNavigationButtons() {
    // Next buttons
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', function() {
            const nextSection = parseInt(this.dataset.next);
            if (validateCurrentSection()) {
                navigateToSection(nextSection);
            }
        });
    });

    // Previous buttons
    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', function() {
            const prevSection = parseInt(this.dataset.prev);
            navigateToSection(prevSection);
        });
    });
}

function navigateToSection(sectionNumber) {
    // Hide current section
    document.querySelector(`.form-section[data-section="${currentSection}"]`).classList.remove('active');

    // Show new section
    document.querySelector(`.form-section[data-section="${sectionNumber}"]`).classList.add('active');

    currentSection = sectionNumber;
    updateProgress();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update input highlight for new section
    setTimeout(() => {
        updateInputHighlight();
        checkSectionComplete();
    }, 100);
}

function updateProgress() {
    const progress = (currentSection / CONFIG.TOTAL_SECTIONS) * 100;
    elements.progressFill.style.width = progress + '%';
    elements.currentSectionText.textContent = currentSection;
    elements.totalSectionsText.textContent = CONFIG.TOTAL_SECTIONS;
}

// ============================================
// Validation
// ============================================

function validateCurrentSection() {
    const section = document.querySelector(`.form-section[data-section="${currentSection}"]`);
    let isValid = true;

    // Clear previous errors
    section.querySelectorAll('.form-group.has-error').forEach(group => {
        group.classList.remove('has-error');
    });

    // Validate required text inputs and selects
    section.querySelectorAll('input[required], select[required]').forEach(input => {
        if (input.type !== 'radio' && input.type !== 'checkbox') {
            if (!input.value.trim()) {
                markFieldAsError(input);
                isValid = false;
            }
        }
    });

    // Validate required radio groups
    const radioGroups = new Set();
    section.querySelectorAll('input[type="radio"][required]').forEach(radio => {
        radioGroups.add(radio.name);
    });

    radioGroups.forEach(groupName => {
        const checked = section.querySelector(`input[type="radio"][name="${groupName}"]:checked`);
        if (!checked) {
            const firstRadio = section.querySelector(`input[type="radio"][name="${groupName}"]`);
            if (firstRadio) {
                markFieldAsError(firstRadio);
                isValid = false;
            }
        }
    });

    // Validate required checkbox groups (at least one must be checked)
    const checkboxGroups = ['howFound', 'visitReason', 'allergies', 'skinCondition',
                           'eyeSymptoms', 'lashCondition', 'pastTroubles',
                           'desiredMenu', 'priorities'];

    checkboxGroups.forEach(groupName => {
        const checkboxes = section.querySelectorAll(`input[type="checkbox"][name="${groupName}"]`);
        if (checkboxes.length > 0) {
            const checked = section.querySelector(`input[type="checkbox"][name="${groupName}"]:checked`);
            if (!checked) {
                markFieldAsError(checkboxes[0]);
                isValid = false;
            }
        }
    });

    // Validate consent checkboxes in section 6
    if (currentSection === 6) {
        const consentCheckboxes = ['treatmentConsent', 'aftercareConsent', 'privacyConsent'];
        consentCheckboxes.forEach(name => {
            const checkbox = section.querySelector(`input[name="${name}"]`);
            if (checkbox && !checkbox.checked) {
                markFieldAsError(checkbox);
                isValid = false;
            }
        });
    }

    // Validate email format
    const emailInput = section.querySelector('input[type="email"]');
    if (emailInput && emailInput.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            markFieldAsError(emailInput);
            isValid = false;
        }
    }

    // Validate phone format
    const phoneInput = section.querySelector('input[type="tel"]');
    if (phoneInput && phoneInput.value) {
        const phoneRegex = /^\d{2,4}-?\d{2,4}-?\d{3,4}$/;
        if (!phoneRegex.test(phoneInput.value.replace(/-/g, ''))) {
            markFieldAsError(phoneInput);
            isValid = false;
        }
    }

    if (!isValid) {
        // Scroll to first error
        const firstError = section.querySelector('.form-group.has-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return isValid;
}

function markFieldAsError(input) {
    const formGroup = input.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('has-error');
    }
}

// ============================================
// Current Date
// ============================================

function initializeCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    elements.currentDateInput.value = `${year}年${month}月${day}日`;
}

// ============================================
// Form Submission
// ============================================

function initializeSubmitButton() {
    elements.submitBtn.addEventListener('click', function() {
        if (validateCurrentSection()) {
            showConfirmationModal();
        }
    });
}

function initializeModalButtons() {
    elements.editBtn.addEventListener('click', function() {
        elements.confirmationModal.classList.remove('active');
    });

    elements.confirmSubmitBtn.addEventListener('click', function() {
        submitForm();
    });

    // Close modal when clicking outside
    elements.confirmationModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });

    // Coupon modal close button
    if (elements.closeCouponBtn) {
        elements.closeCouponBtn.addEventListener('click', function() {
            elements.couponModal.classList.remove('active');
            // Reset form after closing coupon
            setTimeout(() => {
                location.reload();
            }, 500);
        });
    }
}

function showConfirmationModal() {
    const formData = collectFormData();
    const html = generateConfirmationHTML(formData);
    elements.confirmationContent.innerHTML = html;
    elements.confirmationModal.classList.add('active');
}

function collectFormData() {
    const form = elements.form;
    const data = {};

    // Text inputs and selects
    form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], select').forEach(input => {
        if (input.name && input.value) {
            data[input.name] = input.value;
        }
    });

    // Radio buttons
    form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
        data[radio.name] = radio.value;
    });

    // Checkboxes
    const checkboxGroups = {};
    form.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        if (!checkboxGroups[checkbox.name]) {
            checkboxGroups[checkbox.name] = [];
        }
        checkboxGroups[checkbox.name].push(checkbox.value);
    });

    Object.keys(checkboxGroups).forEach(name => {
        data[name] = checkboxGroups[name].join(', ');
    });

    // Hidden inputs (signature)
    form.querySelectorAll('input[type="hidden"]').forEach(input => {
        if (input.name && input.value) {
            data[input.name] = input.value;
        }
    });

    // Combine birth date
    if (data.birthYear && data.birthMonth && data.birthDay) {
        data.birthDate = `${data.birthYear}年${data.birthMonth}月${data.birthDay}日`;
        delete data.birthYear;
        delete data.birthMonth;
        delete data.birthDay;
    }

    return data;
}

function generateConfirmationHTML(data) {
    const sections = [
        {
            title: '基本情報',
            fields: [
                { key: 'name', label: 'お名前' },
                { key: 'furigana', label: 'フリガナ' },
                { key: 'birthDate', label: '生年月日' },
                { key: 'phone', label: '電話番号' },
                { key: 'email', label: 'メールアドレス' }
            ]
        },
        {
            title: '来店経路・ライフスタイル',
            fields: [
                { key: 'howFound', label: '当店を知った経路' },
                { key: 'referrerName', label: '紹介者' },
                { key: 'visitReason', label: '来店動機' },
                { key: 'occupation', label: 'ご職業' },
                { key: 'makeupFrequency', label: 'メイク頻度' },
                { key: 'eyeMakeup', label: '目元メイク' },
                { key: 'sleepPosition', label: '就寝時の姿勢' },
                { key: 'oilCleansing', label: 'オイルクレンジング' }
            ]
        },
        {
            title: '健康状態・目元の状態',
            fields: [
                { key: 'eyeClinic', label: '眼科通院' },
                { key: 'eyeClinicCondition', label: '病名・症状' },
                { key: 'allergies', label: 'アレルギー' },
                { key: 'skinCondition', label: '皮膚疾患' },
                { key: 'pregnancy', label: '妊娠・授乳' },
                { key: 'contactLens', label: 'コンタクトレンズ' },
                { key: 'eyeSymptoms', label: '目元の症状' },
                { key: 'lashCondition', label: 'まつ毛の状態' }
            ]
        },
        {
            title: '施術歴',
            fields: [
                { key: 'lashExtExperience', label: 'エクステ経験' },
                { key: 'lashExtLastTime', label: 'エクステ最終時期' },
                { key: 'lashPermExperience', label: 'パーマ経験' },
                { key: 'lashPermLastTime', label: 'パーマ最終時期' },
                { key: 'browSalonExperience', label: '眉サロン経験' },
                { key: 'pastTroubles', label: '過去のトラブル' }
            ]
        },
        {
            title: 'ご希望・口コミ',
            fields: [
                { key: 'desiredMenu', label: '希望メニュー' },
                { key: 'lashStyle', label: 'まつ毛イメージ' },
                { key: 'browStyle', label: '眉毛イメージ' },
                { key: 'priorities', label: '重視ポイント' },
                { key: 'visitFrequency', label: '来店ペース' },
                { key: 'reviewChoice', label: '口コミ投稿' }
            ]
        },
        {
            title: '同意事項',
            fields: [
                { key: 'snsConsent', label: 'SNS掲載' }
            ]
        }
    ];

    let html = '';

    sections.forEach(section => {
        const hasData = section.fields.some(field => data[field.key]);
        if (hasData) {
            html += `<div class="confirmation-section">
                <h4>${section.title}</h4>`;

            section.fields.forEach(field => {
                if (data[field.key]) {
                    html += `<div class="confirmation-item">
                        <span class="label">${field.label}</span>
                        <span class="value">${escapeHtml(data[field.key])}</span>
                    </div>`;
                }
            });

            html += '</div>';
        }
    });

    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// PDF Generation
// ============================================

function generatePDF(formData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add Japanese font support (using built-in)
    doc.setFont('helvetica');

    // Title
    doc.setFontSize(18);
    doc.text('KATEstageLASH Web問診票', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`作成日: ${formData.date || new Date().toLocaleDateString('ja-JP')}`, 105, 28, { align: 'center' });

    let yPosition = 40;
    const lineHeight = 7;
    const pageHeight = 280;

    const sections = [
        { title: '基本情報', fields: ['name', 'furigana', 'birthDate', 'phone', 'email'] },
        { title: '来店経路・ライフスタイル', fields: ['howFound', 'visitReason', 'occupation', 'makeupFrequency', 'eyeMakeup', 'sleepPosition', 'oilCleansing'] },
        { title: '健康状態・目元の状態', fields: ['eyeClinic', 'allergies', 'skinCondition', 'pregnancy', 'contactLens', 'eyeSymptoms', 'lashCondition'] },
        { title: '施術歴', fields: ['lashExtExperience', 'lashPermExperience', 'browSalonExperience', 'pastTroubles'] },
        { title: 'ご希望・口コミ', fields: ['desiredMenu', 'lashStyle', 'browStyle', 'priorities', 'visitFrequency', 'reviewChoice'] },
        { title: '同意事項', fields: ['snsConsent', 'treatmentConsent', 'aftercareConsent', 'privacyConsent'] }
    ];

    const fieldLabels = {
        name: 'お名前', furigana: 'フリガナ', birthDate: '生年月日', phone: '電話番号', email: 'メールアドレス',
        howFound: '当店を知った経路', visitReason: '来店動機', occupation: 'ご職業', makeupFrequency: 'メイク頻度',
        eyeMakeup: '目元メイク', sleepPosition: '就寝時の姿勢', oilCleansing: 'オイルクレンジング',
        eyeClinic: '眼科通院', allergies: 'アレルギー', skinCondition: '皮膚疾患', pregnancy: '妊娠・授乳',
        contactLens: 'コンタクトレンズ', eyeSymptoms: '目元の症状', lashCondition: 'まつ毛の状態',
        lashExtExperience: 'エクステ経験', lashPermExperience: 'パーマ経験', browSalonExperience: '眉サロン経験',
        pastTroubles: '過去のトラブル', desiredMenu: '希望メニュー', lashStyle: 'まつ毛イメージ',
        browStyle: '眉毛イメージ', priorities: '重視ポイント', visitFrequency: '来店ペース',
        reviewChoice: '口コミ投稿', snsConsent: 'SNS掲載', treatmentConsent: '施術同意',
        aftercareConsent: 'アフターケア同意', privacyConsent: '個人情報同意'
    };

    sections.forEach(section => {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
        }

        // Section title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, 15, yPosition);
        yPosition += lineHeight;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        section.fields.forEach(field => {
            if (formData[field]) {
                if (yPosition > pageHeight - 10) {
                    doc.addPage();
                    yPosition = 20;
                }

                const label = fieldLabels[field] || field;
                const value = String(formData[field]).substring(0, 60); // Truncate long values
                doc.text(`${label}: ${value}`, 20, yPosition);
                yPosition += lineHeight;
            }
        });

        yPosition += 5; // Space between sections
    });

    return doc.output('blob');
}

// ============================================
// Form Submit with PDF
// ============================================

async function submitForm() {
    elements.confirmationModal.classList.remove('active');
    elements.loadingOverlay.classList.add('active');

    const formData = collectFormData();

    // Add timestamp
    formData.timestamp = new Date().toISOString();

    // Generate PDF blob
    let pdfBlob = null;
    try {
        pdfBlob = generatePDF(formData);
        // Convert blob to base64
        const reader = new FileReader();
        const pdfBase64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(pdfBlob);
        });
        formData.pdfData = pdfBase64;
    } catch (pdfError) {
        console.warn('PDF generation failed:', pdfError);
    }

    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        // Since we're using no-cors, we can't read the response
        // Assume success if no error is thrown
        elements.loadingOverlay.classList.remove('active');

        // Show coupon modal instead of success modal
        if (elements.couponModal) {
            elements.couponModal.classList.add('active');
        } else {
            elements.successModal.classList.add('active');
            setTimeout(() => {
                location.reload();
            }, 5000);
        }

    } catch (error) {
        console.error('Submission error:', error);
        elements.loadingOverlay.classList.remove('active');
        alert('送信中にエラーが発生しました。もう一度お試しください。');
    }
}

// ============================================
// Utility Functions
// ============================================

// Prevent double-tap zoom on iOS
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

let lastTouchEnd = 0;
