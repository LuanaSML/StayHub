
document.addEventListener('DOMContentLoaded', function() {
    // Overlays
    const overlayCadastro = document.getElementById('popupoverlay');
    const overlayLogin = document.getElementById('popupoverlay-login');

    // Buttons that open modals
    const btnCadastro = document.getElementById('btnCadastro');
    const btnLogin = document.getElementById('btnLogin');

    // Close buttons
    const btnXCadastro = document.getElementById('popupX');
    const btnXLogin = document.getElementById('popupX-login');

    // Open cadastro
    if (btnCadastro && overlayCadastro) {
        btnCadastro.addEventListener('click', function(e) {
            e.preventDefault();
            overlayCadastro.classList.add('active');
        });
    }

    // Open login
    if (btnLogin && overlayLogin) {
        btnLogin.addEventListener('click', function(e) {
            e.preventDefault();
            overlayLogin.classList.add('active');
        });
    }

    // Close cadastro with X
    if (btnXCadastro && overlayCadastro) {
        btnXCadastro.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            overlayCadastro.classList.remove('active');
        });
    }

    // Close login with X
    if (btnXLogin && overlayLogin) {
        btnXLogin.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            overlayLogin.classList.remove('active');
        });
    }

    // Close when clicking on each overlay outside modal-content
    if (overlayCadastro) {
        overlayCadastro.addEventListener('click', function(e) {
            if (e.target === overlayCadastro) overlayCadastro.classList.remove('active');
        });
    }
    if (overlayLogin) {
        overlayLogin.addEventListener('click', function(e) {
            if (e.target === overlayLogin) overlayLogin.classList.remove('active');
        });
    }

    // Prevent closing when clicking inside modal-content for all modals
    const modalContents = document.querySelectorAll('.modal-content');
    modalContents.forEach(function(mc) {
        mc.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
});

