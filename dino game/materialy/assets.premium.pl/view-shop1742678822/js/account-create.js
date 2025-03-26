const CreateAccountModule = (function () {
    var globalData = {
        initialStep: 1,
        currentStep: 1,
        totalSteps: 4,
        isIndividual: null,
        isPl: null,
        viesCountryCode: null,
        validatedFormData: {},
        successfulSteps: {},
        temp: {},
        activationUrl: null,
        nextAction: null,
    };

    TranslatorModule.addTranslations({
        'Nie zaznaczono wymaganego pola': {
            en: 'Required field not checked',
        },
        'Login musi zawierać od {%1} do {%2} znaków': {
            en: 'Login must contain {%1} to {%2} characters',
        },
        'Login musi zaczynać się od litery': {
            en: 'Login must start with a letter',
        },
        'Niepoprawny adres e-mail': {
            en: 'Invalid e-mail address',
        },
        'Nie wybrano kraju': {
            en: 'No country selected',
        },
        Niepoprawny: {
            en: 'Invalid',
        },
        Niepoprawne: {
            en: 'Invalid',
        },
        Niepoprawna: {
            en: 'Invalid',
        },
        'Imię i nazwisko': {
            en: 'Name and surname',
        },
        'Nazwa firmy': {
            en: 'Company name',
        },
        Ulica: {
            en: 'Street',
        },
        'Nr domu': {
            en: 'Building no.',
        },
        'Nr telefonu': {
            en: 'Phone no.',
        },
        'Kod pocztowy': {
            en: 'Postal code',
        },
        Miejscowość: {
            en: 'Town',
        },
        'Nie przeprowadzono weryfikacji CAPTCHA': {
            en: 'CAPTCHA verification not performed',
        },
        Słabe: {
            en: 'Weak',
        },
        Średnie: {
            en: 'Medium',
        },
        Mocne: {
            en: 'Strong',
        },
        'Bardzo mocne': {
            en: 'Very strong',
        },
        'wypełnij formularz.': {
            en: 'fill in the form.',
        },
        'zaznacz zgody poniżej.': {
            en: 'check the consents below.',
        },
        'uzupełnij swoje dane.': {
            en: 'fill in your details.',
        },
        'sprawdź poprawność wpisanych danych.': {
            en: 'check if the entered data is correct.',
        },
    });

    function startRegistration(accountType) {
        let isIndividual = accountType === 'individual';

        globalData.isIndividual = isIndividual;

        let otherAccountType = isIndividual ? 'company' : 'individual';

        let countrySelect = $('#' + accountType + 'Country');

        countrySelect.trigger('change');

        $('.display-' + accountType).removeClass('d-none');
        $('.display-' + otherAccountType).addClass('d-none');

        $('.disable-' + accountType).prop('disabled', true);
        $('.disable-' + otherAccountType).prop('disabled', false);

        flipCards();
    }

    function flipCards() {
        let accountTypeToOpen = globalData.isIndividual
            ? 'individual'
            : 'company';
        let accountTypeToClose = globalData.isIndividual
            ? 'company'
            : 'individual';

        let cardToOpen = $('#' + accountTypeToOpen + 'AccountCard');
        let cardToClose = $('#' + accountTypeToClose + 'AccountCard');

        let cardToOpenPanel = cardToOpen.find('.panel');
        let cardToClosePanel = cardToClose.find('.panel');

        let cardToOpenFront = cardToOpen.find('.panel-front');
        let cardToOpenBack = cardToOpen.find('.panel-back');

        let cardToCloseFront = cardToClose.find('.panel-front');
        let cardToCloseBack = cardToClose.find('.panel-back');

        cardToOpenFront.addClass('d-none').removeClass('d-flex');
        cardToOpenBack.removeClass('d-none');

        cardToCloseFront.addClass('d-flex').removeClass('d-none');
        cardToCloseBack.addClass('d-none');

        cardToOpenPanel.addClass('panel-primary').removeClass('panel-info');
        cardToClosePanel.addClass('panel-info').removeClass('panel-primary');
    }

    function proceedToStep(step) {
        if (
            step > globalData.currentStep &&
            !stepValidated(globalData.currentStep)
        ) {
            return false;
        }

        if (step < globalData.currentStep) {
            globalData.successfulSteps[globalData.currentStep] = false;
        }

        switch (step) {
            case 2:
                if (!globalData.isIndividual) {
                    let companyData = {};

                    if (globalData.isPl) {
                        companyData.nip = getMergedFormData().tax_id.value;
                    } else if (globalData.viesCountryCode) {
                        companyData.vat_number =
                            getMergedFormData().tax_id.value;
                        companyData.country_code = globalData.viesCountryCode;
                    }

                    if (Object.keys(companyData).length !== 0) {
                        let companyDataChanged = updateTemp(
                            'companyData',
                            companyData
                        );

                        if (companyDataChanged) {
                            let ajaxOptions = {
                                type: 'POST',
                                url:
                                    '/' +
                                    (globalData.isPl ? 'regon' : 'vies') +
                                    '/fetchdata',
                                data: companyData,
                            };

                            $.ajax(ajaxOptions);
                        }
                    }
                }

                break;
            case 3:
                if (globalData.currentStep === 2) {
                    if (!globalData.successfulSteps[step]) {
                        sendRegistrationForm(getMergedFormData());

                        return true;
                    }

                    location.href = globalData.activationUrl;

                    return true;
                }

                break;
            case 4:
                let mergedFormData = getMergedFormData();

                if (globalData.isPl) {
                    let polishUserData = {
                        name: mergedFormData.name.value,
                        locality: mergedFormData.locality.value,
                        postalCode: mergedFormData.postal_code.value,
                        street: mergedFormData.street.value,
                    };

                    let polishUserDataChanged = updateTemp(
                        'polishUserData',
                        polishUserData
                    );

                    if (polishUserDataChanged) {
                        let suspiciousDataConfirmation = $(
                            '#suspiciousDataConfirmation'
                        );

                        suspiciousDataConfirmation.val(0);

                        removeInputErrors(suspiciousDataConfirmation);
                    }

                    if (
                        !globalData.successfulSteps[step] &&
                        polishUserDataChanged
                    ) {
                        validatePolishUserData(polishUserData, mergedFormData);

                        return true;
                    }
                }

                prepareSummary(mergedFormData);

                break;
            case 5:
                if (!globalData.successfulSteps[step]) {
                    sendActivationForm(getMergedFormData());

                    return true;
                }

                location.href = '/user/creator/userdata/finalize/';

                return true;
        }

        setStepBreadcrumb(step);
        setStepPanel(step);

        globalData.currentStep = step;
    }

    function updateTemp(key, data) {
        let dataJoined = Object.values(data).join('|');

        if (globalData.temp[key] !== dataJoined) {
            globalData.temp[key] = dataJoined;

            return true;
        }

        return false;
    }

    function getMergedFormData() {
        return Object.assign(
            {},
            ...Object.values(globalData.validatedFormData)
        );
    }

    function prepareSummary(formData) {
        $.each(formData, function (key, data) {
            let summaryId = data.id + 'Summary';

            let summaryElement = $('#' + summaryId);

            if (summaryElement.length) {
                summaryElement.text(
                    (data.id === 'houseNumber' && data.value ? '/' : '') +
                        data.value
                );
            }
        });
    }

    function setStepBreadcrumb(step) {
        $('#currentStep').html(step);

        $('#stepDescription').html(getStepDescription(step));
    }

    function setStepPanel(step) {
        $('.step-panel').each(function (index, domElement) {
            let element = $(domElement);

            if (index + globalData.initialStep === step) {
                element.removeClass('d-none');
            } else {
                element.addClass('d-none');
            }
        });
    }

    function removeInputErrors(inputElement) {
        input = inputElement instanceof jQuery ? inputElement : $(inputElement);

        let formGroup = input.closest('.form-group');
        let helpBlock = input.nextAll('.help-block').first();

        helpBlock.addClass('d-none');

        formGroup.removeClass('has-error has-warning');

        if (input.is(':checkbox')) {
            input.removeClass('input-error input-warning');
        }
    }

    function addInputError(inputElement, errorMessage = null, warning = false) {
        input = inputElement instanceof jQuery ? inputElement : $(inputElement);

        let formGroup = input.closest('.form-group');
        let helpBlock = input.nextAll('.help-block').first();

        if (errorMessage) {
            helpBlock.text(errorMessage);
        }

        if (helpBlock.text()) {
            helpBlock.removeClass('d-none');
        }

        let errorType = warning ? 'warning' : 'error';

        formGroup.addClass('has-' + errorType);

        if (input.is(':checkbox')) {
            input.addClass('input-' + errorType);
        }
    }

    function stepValidated(step) {
        let stepValidated = true;

        switch (step) {
            case 1:
                delete globalData.validatedFormData[
                    'step' +
                        step +
                        capitalizeFirstLetters(
                            globalData.isIndividual ? 'company' : 'individual'
                        ) +
                        'AccountForm'
                ];

                stepValidated = validateForm(
                    'step' +
                        step +
                        capitalizeFirstLetters(
                            globalData.isIndividual ? 'individual' : 'company'
                        ) +
                        'AccountForm'
                );

                break;
            case 2:
            case 3:
            case 4:
                stepValidated = validateForm('step' + step + 'Form');

                break;
        }

        return stepValidated;
    }

    function validateForm(formID) {
        delete globalData.validatedFormData[formID];

        let formValidated = true;

        let form = $('#' + formID);

        let validatedFormData = {};

        form.find(':input:enabled:not(:button)').each(function () {
            let input = $(this);

            let errorMessage = validateInput(input);

            if (errorMessage) {
                formValidated = false;

                addInputError(input, errorMessage);

                return true;
            }

            let inputValue = input.val().trim();
            let inputName = input.attr('name');
            let inputType = input.attr('type');

            switch (inputName) {
                case 'name':
                case 'locality':
                case 'street':
                    inputValue = capitalizeFirstLetters(
                        inputValue,
                        true,
                        inputName === 'street'
                    );
                    input.val(inputValue);

                    break;
                case 'postal_code':
                    if (globalData.isPl) {
                        input.val(UtilsModule.formatPolishPostalCode(inputValue));
                    }
                            
                    break;
            }

            validatedFormData[input.attr('name')] = {
                value: inputValue,
                id: input.attr('id'),
                send: inputType === 'checkbox' ? input.prop('checked') : true,
            };

            removeInputErrors(input);
        });

        if (formValidated) {
            globalData.validatedFormData[formID] = validatedFormData;
        }

        return formValidated;
    }

    function capitalizeFirstLetters(
        text,
        separatedByDashes = false,
        endingWithDotsAndSpace = true
    ) {
        let words = text.split(' ');

        return words
            .map(function (word, index) {
                if (
                    endingWithDotsAndSpace &&
                    word.endsWith('.') &&
                    words[index + 1] !== undefined
                ) {
                    return word;
                }

                if (separatedByDashes) {
                    return word
                        .split('-')
                        .map(function (part) {
                            return part.charAt(0).toUpperCase() + part.slice(1);
                        })
                        .join('-');
                } else {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                }
            })
            .join(' ');
    }

    function validateInput(input) {
        let errorMessage = '';

        let inputType = input.attr('type');

        if (
            inputType === 'checkbox' &&
            input.attr('required') &&
            !input.prop('checked')
        ) {
            return TranslatorModule.translate('Nie zaznaczono wymaganego pola');
        }

        let inputName = input.attr('name');
        let inputValue = input.val().trim();

        switch (inputName) {
            case 'login':
                let minLoginLength = input.attr('minlength');
                let maxLoginLength = input.attr('maxlength');

                if (
                    inputValue.length < minLoginLength ||
                    inputValue.length > maxLoginLength
                ) {
                    return TranslatorModule.translate(
                        'Login musi zawierać od {%1} do {%2} znaków',
                        { '%1': minLoginLength, '%2': maxLoginLength }
                    );
                }

                let startsWithLetterRegex = /^[a-zA-Z]/;

                if (!startsWithLetterRegex.test(inputValue)) {
                    return 'Login musi zaczynać się od litery';
                }

                break;
            case 'email':
                let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailRegex.test(inputValue)) {
                    return TranslatorModule.translate(
                        'Niepoprawny adres e-mail'
                    );
                }

                break;
            case 'country':
                if (!inputValue) {
                    return TranslatorModule.translate('Nie wybrano kraju');
                }

                break;

            case 'tax_id':
                let alphaNumericRegex = /^[\p{L}\p{M}\p{N}]+$/u;

                if (!alphaNumericRegex.test(inputValue)) {
                    return (
                        TranslatorModule.translate('Niepoprawny') +
                        ' ' +
                        (globalData.isPl
                            ? 'NIP'
                            : globalData.viesCountryCode
                            ? 'VAT-ID'
                            : 'TAX-ID')
                    );
                }

                break;

            case 'name':
                if (
                    inputValue.replace(/\d+/g, '').trim().split(/\s+/).length <
                    2
                ) {
                    return (
                        TranslatorModule.translate('Niepoprawne') +
                        ' ' +
                        TranslatorModule.translate(
                            'Imię i nazwisko'
                        ).toLowerCase()
                    );
                }

                break;
            case 'company_name':
                if (!inputValue) {
                    return (
                        TranslatorModule.translate('Niepoprawna') +
                        ' ' +
                        TranslatorModule.translate('Nazwa firmy').toLowerCase()
                    );
                }

                break;
            case 'street':
                if (!inputValue) {
                    return (
                        TranslatorModule.translate('Niepoprawna') +
                        ' ' +
                        TranslatorModule.translate('Ulica').toLowerCase()
                    );
                }

                break;
            case 'street_number':
                if (!inputValue) {
                    return (
                        TranslatorModule.translate('Niepoprawny') +
                        ' ' +
                        TranslatorModule.translate('Nr domu').toLowerCase()
                    );
                }

                break;
            case 'phone_number':
                let phoneRegex = /^[\d+.]+$/;

                let digitCount = (inputValue.match(/\d/g) || []).length;

                if (!inputValue.match(phoneRegex) || digitCount < 3) {
                    return (
                        TranslatorModule.translate('Niepoprawny') +
                        ' ' +
                        TranslatorModule.translate('Nr telefonu').toLowerCase()
                    );
                }

                break;

            case 'postal_code':
                if (!inputValue) {
                    return (
                        TranslatorModule.translate('Niepoprawny') +
                        ' ' +
                        TranslatorModule.translate('Kod pocztowy').toLowerCase()
                    );
                }

                break;
            case 'locality':
                if (!inputValue) {
                    return (
                        TranslatorModule.translate('Niepoprawna') +
                        ' ' +
                        TranslatorModule.translate('Miejscowość').toLowerCase()
                    );
                }

                break;
            case 'captcha_token': {
                if (!inputValue) {
                    return TranslatorModule.translate(
                        'Nie przeprowadzono weryfikacji CAPTCHA'
                    );
                }
            }
        }

        return errorMessage;
    }

    function getPostData(formData) {
        let postData = {};

        Object.entries(formData).forEach(([key, object]) => {
            if (object.send) {
                postData[key] = object.value;
            }
        });

        return postData;
    }

    function validatePolishUserData(polishUserData, formData) {
        let postData = [
            {
                dataType: 'polishName',
                dataName: 'name',
                dataValues: {
                    name: polishUserData.name,
                },
            },
            {
                dataType: 'polishAddress',
                dataName: 'address',
                dataValues: {
                    postal_code: polishUserData.postalCode,
                    locality: polishUserData.locality,
                    street: polishUserData.street,
                },
            },
        ];

        let boundErrorHandler = function (request, statusText, error) {
            onSubmitError(request, statusText, error, formData);
        };

        let boundSuccessHandler = function (data, statusText, request) {
            onSubmitSuccess(data, statusText, request, { step: 4 });
        };

        let ajaxOptions = {
            beforeSend: onSubmit,
            complete: onSubmitComplete,
            success: boundSuccessHandler,
            error: boundErrorHandler,
            type: 'POST',
            url: '/validation/validate',
            data: JSON.stringify(postData),
            contentType: 'application/json',
        };

        $.ajax(ajaxOptions);
    }

    function sendRegistrationForm(formData) {
        let postData = getPostData(formData);

        postData.formid = $('#registrationForm').data('form-id');
        postData.individual = globalData.isIndividual ? 1 : 0;
        postData['next[action]'] = globalData.nextAction;
        postData['next[id]'] = globalData.itemId;

        let boundErrorHandler = function (request, statusText, error) {
            onSubmitError(request, statusText, error, formData);
        };

        let boundSuccessHandler = function (data, statusText, request) {
            globalData.activationUrl = data.data.activationUrl;

            onSubmitSuccess(data, statusText, request, { step: 3 });
        };

        let ajaxOptions = {
            beforeSend: onSubmit,
            complete: onSubmitComplete,
            success: boundSuccessHandler,
            error: boundErrorHandler,
            type: 'POST',
            url: '/account/create/create.html',
            data: postData,
        };

        $.ajax(ajaxOptions);
    }

    function sendActivationForm(formData) {
        let postData = getPostData(formData);

        postData.formid = $('#activationForm').data('form-id');

        postData.data_currency_confirmation_statement = $(
            'label[for="dataCurrencyConfirmation"]'
        ).text();

        let boundErrorHandler = function (request, statusText, error) {
            onSubmitError(request, statusText, error, formData);
        };

        let boundSuccessHandler = function (data, statusText, request) {
            onSubmitSuccess(data, statusText, request, { step: 5 });
        };

        let ajaxOptions = {
            beforeSend: onSubmit,
            complete: onSubmitComplete,
            success: boundSuccessHandler,
            error: boundErrorHandler,
            type: 'POST',
            url: '/user/creator/userdata/store/',
            data: postData,
        };

        $.ajax(ajaxOptions);
    }

    function onSubmit() {
        disableForms();
    }

    function onSubmitComplete() {
        enableForms();
    }

    function disableForms() {
        $('fieldset').prop('disabled', true);
    }

    function enableForms() {
        $('fieldset').prop('disabled', false);
    }

    function onSubmitError(request, statusText, error, additionalData) {
        let errorDetails = request.responseJSON?.errorDetails;
        let errorMessage = request.responseJSON?.message;
        let errorStatusCode = request.status;
        let errorType = 'error';

        if (errorDetails) {
            let validationErrors = errorDetails.validationErrors;

            if (validationErrors) {
                let suspiciousData = globalData.currentStep === 3;

                if (suspiciousData) {
                    suspiciousDataWarning();
                }

                let messages = [];

                Object.entries(validationErrors).forEach(([key, value]) => {
                    let extendedErrors =
                        typeof value === 'object' && value !== null;

                    let errorMessages = extendedErrors
                        ? value
                        : { message: value };

                    Object.entries(errorMessages).forEach(
                        ([subKey, errorDetail]) => {
                            let inputElement = $(
                                '#' +
                                    additionalData[
                                        extendedErrors ? subKey : key
                                    ]?.id
                            );

                            if (inputElement.length) {
                                addInputError(
                                    inputElement,
                                    null,
                                    suspiciousData
                                );
                            }

                            messages.push(errorDetail.message || errorDetail);
                        }
                    );
                });

                errorMessage = suspiciousData
                    ? TranslatorModule.translate('Sprawdź, czy wszystkie pola zostały wypełnione prawidłowo (np. czy nie zostały pominięte lub zamienione litery, czy są polskie znaki itp.). Jeśli jesteś pewien, możesz przejść dalej.')
                    : messages
                    ? messages.join('</br>')
                    : null;

                if (suspiciousData) {
                    errorType = 'warning';
                }
            }

            if (
                errorStatusCode === 422 &&
                [2, 4].includes(globalData.currentStep)
            ) {
                proceedToStep(globalData.currentStep - 1);
            }
        }

        UtilsModule.setAlertMessage(
            errorMessage ??
                TranslatorModule.translate('Wystąpił nieoczekiwany błąd.'),
            errorType
        );
    }

    function suspiciousDataWarning() {
        let suspiciousDataConfirmation = $('#suspiciousDataConfirmation');

        suspiciousDataConfirmation.val(1);

        addInputError(suspiciousDataConfirmation, null, true);
    }

    function onSubmitSuccess(data, statusText, request, additionalData) {
        enableForms();

        globalData.successfulSteps[additionalData.step] = true;

        proceedToStep(additionalData.step);
    }

    function countryChanged(countrySelect) {
        countrySelect = $(countrySelect);

        let selectedCountry = countrySelect.find('option:selected');
        let viesCountryCode = selectedCountry.data('vies-country-code');
        let taxIdInput = $('#taxId');

        let isPl = selectedCountry.val().toLowerCase() === 'pl';

        taxIdInput.attr(
            'placeholder',
            isPl ? 'NIP' : viesCountryCode ? 'VAT-ID' : 'TAX-ID'
        );

        globalData.viesCountryCode = viesCountryCode;

        globalData.isPl = isPl;
    }

    function nextActionClicked(nextActionRadio) {
        nextActionRadio = $(nextActionRadio);

        let nextAction = nextActionRadio.val();

        let nextActionNameField = $('#nextActionName');

        if (nextActionNameField.length > 0) {
            nextActionNameField.val(nextAction);
        }

        globalData.nextAction = nextAction;

        globalData.totalSteps = getTotalSteps(nextAction);

        $('#totalSteps').html(globalData.totalSteps);
    }

    function getTotalSteps(action) {
        switch (action) {
            case 'buynow':
                return 6;
            case 'auction':
            case 'bid':
            case 'instalment':
            case 'leasing':
            case 'negotiations':
                return 7;
        }
    }

    function getStepDescription(step) {
        let description = '';

        switch (step) {
            case 1:
                description = 'wypełnij formularz.';

                break;
            case 2:
                description = 'zaznacz zgody poniżej.';

                break;
            case 3:
                description = 'uzupełnij swoje dane.';
                
                break;
            case 4:
                description = 'sprawdź poprawność wpisanych danych.';
        }

        return TranslatorModule.translate(description);
    }

    function showRegisterForm() {
        $('#loginForm').hide();

        $('#registerForm').show();
    }

    function showLoginForm() {
        $('#registerForm').hide();

        $('#loginForm').show();
    }

    function loadGlobalData() {
        $('#jsData input').each(function () {
            let input = $(this);
            let key = input.attr('name');
            let value = input.val();

            switch (input.data('type')) {
                case 'number':
                    globalData[key] = Number(value);
                    break;
                case 'bool':
                    globalData[key] = UtilsModule.toBoolean(value);
                    break;
                default:
                    globalData[key] = value;
            }
        });
    }

    function init() {
        loadGlobalData();
    }

    return {
        globalData: globalData,
        startRegistration: startRegistration,
        removeInputErrors: removeInputErrors,
        countryChanged: countryChanged,
        nextActionClicked: nextActionClicked,
        proceedToStep: proceedToStep,
        showRegisterForm: showRegisterForm,
        showLoginForm: showLoginForm,
        init: init,
    };
})();

$(document).ready(function () {
    CreateAccountModule.init();
});
