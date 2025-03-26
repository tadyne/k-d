const RecaptchaModule = (function () {
    var globalData = {};

    TranslatorModule.addTranslations({
        'Token CAPTCHA stracił ważność, ponów weryfikację.': {
            en: 'The CAPTCHA token has expired, please retry verification.',
        },
        'Wystąpił błąd weryfikacji CAPTCHA, spróbuj ponownie później.': {
            en: 'A CAPTCHA verification error occurred, please try again later.',
        },
    });

    function verifyRecaptcha(captchaToken) {
        $.ajax({
            success: onSubmitSuccess,
            error: onSubmitError,
            type: 'POST',
            url: globalData.verifyUrl,
            data: {
                captcha_token: captchaToken,
                form_uuid: $('#formUuid').val(),
            },
        });
    }

    function onRecaptchaSuccess(captchaToken) {
        verifyRecaptcha(captchaToken);
    }

    function onRecaptchaExpired() {
        if (!$('#captchaToken').val()) {
            showError(
                TranslatorModule.translate('Token odpowiedzi stracił ważność, ponów weryfikację CAPTCHA.')
            );
            grecaptcha.reset();
        }
    }

    function onRecaptchaError() {
        showError(TranslatorModule.translate('Wystąpił błąd weryfikacji CAPTCHA, spróbuj ponownie później.'));
    }

    function onRecaptchaLoad() {
        let formUuidElement = $('#formUuid');
        if (!formUuidElement.val()) {
            formUuidElement.val(uuidv4());
        }

        grecaptcha.render('recaptcha', {
            sitekey: Recaptcha.siteKey,
            callback: onRecaptchaSuccess,
            'expired-callback': onRecaptchaExpired,
            'error-callback': onRecaptchaError,
        });
    }

    function onSubmitSuccess(data, statusText, request) {
        let recaptchaElement = $('#recaptcha');

        $('#submitButton').prop('disabled', false);
        $('#captchaToken').val(data.data.captchaToken);

        recaptchaElement.empty();

        let helpBlock = recaptchaElement.nextAll('.help-block').first();

        if (helpBlock.length) {
            helpBlock.text('');
        }
    }

    function onSubmitError(request, statusText, error) {
        let errorDetails = request.responseJSON?.errorDetails;
        let errorMessage =
            request.responseJSON?.message ?? TranslatorModule.translate('Wystąpił nieoczekiwany błąd.');

        if (errorDetails) {
            if (errorDetails.newFormUuid) {
                $('#formUuid').val(newFormUuid);
            }
            if (errorDetails.newCaptcha) {
                grecaptcha.reset();
            }
        }

        showError(errorMessage);
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

    function showError(errorMessage) {
        UtilsModule.setAlertMessage(errorMessage, 'error');
    }

    function init() {
        Recaptcha.loadScript();
    }

    return {
        onRecaptchaLoad: onRecaptchaLoad,
        loadGlobalData: loadGlobalData,
        init: init,
    };
})();

RecaptchaModule.init();

window.onRecaptchaLoad = RecaptchaModule.onRecaptchaLoad;

$(document).ready(function () {
    RecaptchaModule.loadGlobalData();
});
