// Esperar o DOM carregar completamente
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('popupoverlay');
    const btnCadastro = document.getElementById('btnCadastro');
    const btnX = document.getElementById('popupX');
    
    // Abrir modal quando clicar em CADASTRO
    if (btnCadastro) {
        btnCadastro.addEventListener('click', function(e) {
            e.preventDefault();
            overlay.classList.add('active');
        });
    }
    
    // Fechar modal quando clicar no X
    if (btnX) {
        btnX.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            overlay.classList.remove('active');
        });
    }
    
    // Fechar modal quando clicar no overlay (fundo escuro)
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
    
    // Prevenir fechamento quando clicar no conteúdo do modal
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});

