// Função para obter CSRF token
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function getCsrfToken() {
  return getCookie("csrftoken");
}

// Função para atualizar o header baseado no estado do usuário
function updateHeader(user) {
  const navDireita = document.querySelector(".direita");
  if (!navDireita) return;

  if (user) {
    // Usuário logado - mostrar nome e botão sair
    navDireita.innerHTML = `
            <span class="usuario-logado">Olá, ${user.nome}</span>
            <a class="sair" href="#" id="btnLogout">SAIR</a>
        `;

    // Adicionar evento ao botão de sair
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
      btnLogout.addEventListener("click", function (e) {
        e.preventDefault();
        fazerLogout();
      });
    }
  } else {
    // Usuário não logado - mostrar login e cadastro
    navDireita.innerHTML = `
            <a class="login" href="#" id="btnLogin">LOGIN</a>
            <a class="criar" href="#" id="btnCadastro">CADASTRO</a>
        `;

    // Re-adicionar eventos aos botões
    setupPopupButtons();
  }
}

// Função para mostrar mensagem de erro no popup
function mostrarErro(popup, mensagem) {
  // Remover mensagens anteriores
  const mensagemAnterior = popup.querySelector(".mensagem-erro");
  if (mensagemAnterior) {
    mensagemAnterior.remove();
  }

  // Criar nova mensagem
  const mensagemErro = document.createElement("div");
  mensagemErro.className = "mensagem-erro";
  mensagemErro.textContent = mensagem;
  mensagemErro.style.color = "red";
  mensagemErro.style.marginTop = "10px";
  mensagemErro.style.textAlign = "center";

  const form = popup.querySelector(".popup-form");
  if (form) {
    form.appendChild(mensagemErro);
  }
}

// Função para fazer cadastro
function fazerCadastro(nome, email, senha) {
  const overlayCadastro = document.getElementById("popupoverlay");

  fetch("/api/cadastro/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
    },
    body: JSON.stringify({
      nome: nome,
      email: email,
      senha: senha,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Fechar popup
        overlayCadastro.classList.remove("active");
        // Limpar formulário
        document.getElementById("nome").value = "";
        document.getElementById("email").value = "";
        document.getElementById("senha").value = "";
        // Atualizar header
        updateHeader(data.user);
        // Recarregar página para garantir que tudo está sincronizado
        window.location.reload();
      } else {
        mostrarErro(overlayCadastro, data.message);
      }
    })
    .catch((error) => {
      mostrarErro(
        overlayCadastro,
        "Erro ao conectar com o servidor. Tente novamente."
      );
    });
}

// Função para mudar nome do usuário
function mudarNomeUsuario(novoNome) {
  const overlayMudarNome = document.getElementById("popupoverlay-mudar-nome");

  fetch("/api/mudar-nome/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
    },
    body: JSON.stringify({
      novo_nome: novoNome,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Fechar popup
        if (overlayMudarNome) {
          overlayMudarNome.classList.remove("active");
        }
        // Atualizar nome no header
        const usuarioLogado = document.querySelector(".usuario-logado");
        if (usuarioLogado) {
          usuarioLogado.textContent = `Olá, ${data.novo_nome}`;
        }
        // Recarregar página para garantir sincronização
        window.location.reload();
      } else {
        mostrarErro(overlayMudarNome, data.message);
      }
    })
    .catch((error) => {
      console.error("Erro:", error);
      mostrarErro(
        overlayMudarNome,
        "Erro ao conectar com o servidor. Tente novamente."
      );
    });
}

// Função para fazer login
function fazerLogin(email, senha) {
  const overlayLogin = document.getElementById("popupoverlay-login");

  fetch("/api/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
    },
    body: JSON.stringify({
      email: email,
      senha: senha,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Fechar popup
        overlayLogin.classList.remove("active");
        // Limpar formulário
        document.getElementById("emailLogin").value = "";
        document.getElementById("senhaLogin").value = "";
        // Atualizar header
        updateHeader(data.user);
        // Recarregar página para garantir que tudo está sincronizado
        window.location.reload();
      } else {
        mostrarErro(overlayLogin, data.message);
      }
    })
    .catch((error) => {
      mostrarErro(
        overlayLogin,
        "Erro ao conectar com o servidor. Tente novamente."
      );
    });
}

// Função para fazer logout
function fazerLogout() {
  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    alert('Erro: Token CSRF não encontrado. Por favor, recarregue a página.');
    return;
  }

  fetch("/api/logout/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Erro na resposta do servidor: ' + response.status);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        // Atualizar header
        updateHeader(null);
        // Recarregar página
        window.location.reload();
      } else {
        alert('Erro ao fazer logout: ' + (data.message || 'Erro desconhecido'));
      }
    })
    .catch((error) => {
      console.error("Erro ao fazer logout:", error);
      alert('Erro ao conectar com o servidor. Tente novamente.');
    });
}

// Função para configurar os botões dos popups
function setupPopupButtons() {
  const overlayCadastro = document.getElementById("popupoverlay");
  const overlayLogin = document.getElementById("popupoverlay-login");
  const btnCadastro = document.getElementById("btnCadastro");
  const btnLogin = document.getElementById("btnLogin");

  // Open cadastro
  if (btnCadastro && overlayCadastro) {
    btnCadastro.addEventListener("click", function (e) {
      e.preventDefault();
      overlayCadastro.classList.add("active");
    });
  }

  // Open login
  if (btnLogin && overlayLogin) {
    btnLogin.addEventListener("click", function (e) {
      e.preventDefault();
      overlayLogin.classList.add("active");
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Overlays
  const overlayCadastro = document.getElementById("popupoverlay");
  const overlayLogin = document.getElementById("popupoverlay-login");
  const overlayMudarNome = document.getElementById("popupoverlay-mudar-nome");

  // Buttons that open modals
  const btnCadastro = document.getElementById("btnCadastro");
  const btnLogin = document.getElementById("btnLogin");
  const btnMudarNome = document.getElementById("btnMudarNome");

  // Close buttons
  const btnXCadastro = document.getElementById("popupX");
  const btnXLogin = document.getElementById("popupX-login");
  const btnXMudarNome = document.getElementById("popupX-mudar-nome");

  // Setup popup buttons
  setupPopupButtons();

  // Close cadastro with X
  if (btnXCadastro && overlayCadastro) {
    btnXCadastro.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      overlayCadastro.classList.remove("active");
      // Limpar mensagens de erro
      const mensagemErro = overlayCadastro.querySelector(".mensagem-erro");
      if (mensagemErro) {
        mensagemErro.remove();
      }
    });
  }

  // Close login with X
  if (btnXLogin && overlayLogin) {
    btnXLogin.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      overlayLogin.classList.remove("active");
      // Limpar mensagens de erro
      const mensagemErro = overlayLogin.querySelector(".mensagem-erro");
      if (mensagemErro) {
        mensagemErro.remove();
      }
    });
  }

  // Open mudar nome popup
  if (btnMudarNome && overlayMudarNome) {
    btnMudarNome.addEventListener("click", function (e) {
      e.preventDefault();
      overlayMudarNome.classList.add("active");
    });
  }

  // Close mudar nome with X
  if (btnXMudarNome && overlayMudarNome) {
    btnXMudarNome.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      overlayMudarNome.classList.remove("active");
      const mensagemErro = overlayMudarNome.querySelector(".mensagem-erro");
      if (mensagemErro) {
        mensagemErro.remove();
      }
    });
  }

  // Close when clicking on each overlay outside modal-content
  if (overlayCadastro) {
    overlayCadastro.addEventListener("click", function (e) {
      if (e.target === overlayCadastro) {
        overlayCadastro.classList.remove("active");
        // Limpar mensagens de erro
        const mensagemErro = overlayCadastro.querySelector(".mensagem-erro");
        if (mensagemErro) {
          mensagemErro.remove();
        }
      }
    });
  }
  if (overlayLogin) {
    overlayLogin.addEventListener("click", function (e) {
      if (e.target === overlayLogin) {
        overlayLogin.classList.remove("active");
        // Limpar mensagens de erro
        const mensagemErro = overlayLogin.querySelector(".mensagem-erro");
        if (mensagemErro) {
          mensagemErro.remove();
        }
      }
    });
  }
  if (overlayMudarNome) {
    overlayMudarNome.addEventListener("click", function (e) {
      if (e.target === overlayMudarNome) {
        overlayMudarNome.classList.remove("active");
        const mensagemErro = overlayMudarNome.querySelector(".mensagem-erro");
        if (mensagemErro) {
          mensagemErro.remove();
        }
      }
    });
  }

  // Prevent closing when clicking inside modal-content for all modals
  const modalContents = document.querySelectorAll(".modal-content");
  modalContents.forEach(function (mc) {
    mc.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  });

  // Formulário de cadastro
  const formCadastro = document.querySelector("#popupoverlay .popup-form");
  if (formCadastro) {
    formCadastro.addEventListener("submit", function (e) {
      e.preventDefault();
      const nome = document.getElementById("nome").value.trim();
      const email = document.getElementById("email").value.trim();
      const senha = document.getElementById("senha").value.trim();

      if (nome && email && senha) {
        fazerCadastro(nome, email, senha);
      }
    });
  }

  // Formulário de login
  const formLogin = document.querySelector("#popupoverlay-login .popup-form");
  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("emailLogin").value.trim();
      const senha = document.getElementById("senhaLogin").value.trim();

      if (email && senha) {
        fazerLogin(email, senha);
      }
    });
  }

  // Botão de logout (se existir)
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", function (e) {
      e.preventDefault();
      fazerLogout();
    });
  }

  // Formulário de mudar nome
  const formMudarNome = document.getElementById("formMudarNome");
  if (formMudarNome) {
    formMudarNome.addEventListener("submit", function (e) {
      e.preventDefault();
      const novoNome = document.getElementById("novoNome").value.trim();
      if (novoNome) {
        mudarNomeUsuario(novoNome);
      }
    });
  }

  // Botão manter nome
  const btnManterNome = document.getElementById("btnManterNome");
  if (btnManterNome && overlayMudarNome) {
    btnManterNome.addEventListener("click", function (e) {
      e.preventDefault();
      overlayMudarNome.classList.remove("active");
    });
  }

  // Formulário de reserva
  const formReserva = document.getElementById("formReserva");
  if (formReserva) {
    formReserva.addEventListener("submit", function (e) {
      e.preventDefault();

      // Verificar se está logado (verificar se existe o elemento de usuário logado)
      const usuarioLogado = document.querySelector(".usuario-logado");
      if (!usuarioLogado) {
        // Não está logado, mostrar popup de cadastro
        const overlayCadastro = document.getElementById("popupoverlay");
        if (overlayCadastro) {
          overlayCadastro.classList.add("active");
        }
        return;
      }

      // Obter valores do formulário
      const quartoId = document.getElementById("quarto_id").value;
      const checkin = document.getElementById("checkin").value;
      const checkout = document.getElementById("checkout").value;
      const hospedes = document.getElementById("hospedes").value;

      // Validar campos
      if (!checkin || !checkout || !hospedes) {
        mostrarErroReserva("Todos os campos são obrigatórios.");
        return;
      }

      // Validar que checkout é depois de checkin
      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      if (checkoutDate <= checkinDate) {
        mostrarErroReserva(
          "A data de check-out deve ser posterior à data de check-in."
        );
        return;
      }

      // Enviar reserva
      fazerReserva(quartoId, checkin, checkout, hospedes);
    });
  }
});

// Função para mostrar erro na reserva
function mostrarErroReserva(mensagem) {
  const mensagemErro = document.getElementById("mensagemErroReserva");
  if (mensagemErro) {
    mensagemErro.textContent = mensagem;
    mensagemErro.style.display = "block";
  }
}

// Função para fazer reserva
function fazerReserva(quartoId, checkin, checkout, hospedes) {
  const mensagemErro = document.getElementById("mensagemErroReserva");

  fetch("/api/reserva/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
    },
    body: JSON.stringify({
      quarto_id: quartoId,
      checkin: checkin,
      checkout: checkout,
      hospedes: hospedes,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Limpar mensagem de erro
        if (mensagemErro) {
          mensagemErro.style.display = "none";
        }
        // Redirecionar para página de pagamento
        window.location.href = "/pagamento/" + data.reserva_id + "/";
      } else {
        mostrarErroReserva(data.message);
      }
    })
    .catch((error) => {
      mostrarErroReserva("Erro ao conectar com o servidor. Tente novamente.");
    });
}

// Funções para página de pagamento
function getCookiePagamento(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function getCsrfTokenPagamento() {
  const csrfInput = document.querySelector("[name=csrfmiddlewaretoken]");
  if (csrfInput) {
    return csrfInput.value;
  }
  return getCookiePagamento("csrftoken");
}

function inicializarPagamento() {
  const botaoPagamento = document.getElementById("botaoPagamentoRealizado");

  if (!botaoPagamento) {
    console.error("Botão de pagamento não encontrado na função inicializarPagamento");
    return;
  }

  // Verificar se já foi inicializado
  if (botaoPagamento.hasAttribute('data-inicializado')) {
    console.log("Botão já foi inicializado, pulando...");
    return;
  }

  const mainElement = document.querySelector(".pagamentoContainer");
  if (!mainElement) {
    console.error("Elemento principal de pagamento não encontrado");
    return;
  }

  const reservaId = parseInt(mainElement.getAttribute("data-reserva-id"));
  if (isNaN(reservaId)) {
    console.error("ID da reserva inválido:", mainElement.getAttribute("data-reserva-id"));
    return;
  }

  console.log("Inicializando botão de pagamento para reserva ID:", reservaId);

  botaoPagamento.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log("Botão de pagamento clicado! Reserva ID:", reservaId);
    
    const csrfToken = getCsrfTokenPagamento();

    if (!csrfToken) {
      alert("Erro: Token CSRF não encontrado. Por favor, recarregue a página.");
      return;
    }

    // Desabilitar botão para evitar cliques múltiplos
    botaoPagamento.disabled = true;
    botaoPagamento.textContent = "Processando...";

    console.log("Enviando requisição para finalizar pagamento...");
    fetch("/api/finalizar-pagamento/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({
        reserva_id: reservaId,
      }),
    })
      .then((response) => {
        console.log("Resposta recebida, status:", response.status);
        if (!response.ok) {
          throw new Error("Erro na resposta do servidor: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Resposta do servidor:", data);
        if (data.success) {
          console.log("Pagamento realizado com sucesso! Redirecionando...");
          // Pequeno delay para garantir que o banco foi atualizado
          setTimeout(function() {
            window.location.href = data.redirect_url || "/quartos/";
          }, 200);
        } else {
          alert(
            "Erro ao finalizar pagamento: " +
              (data.message || "Erro desconhecido")
          );
          botaoPagamento.disabled = false;
          botaoPagamento.textContent = "Pagamento Realizado";
        }
      })
      .catch((error) => {
        console.error("Erro completo:", error);
        alert("Erro ao conectar com o servidor. Por favor, tente novamente. Erro: " + error.message);
        botaoPagamento.disabled = false;
        botaoPagamento.textContent = "Pagamento Realizado";
      });
  });
  
  // Marcar como inicializado
  botaoPagamento.setAttribute('data-inicializado', 'true');
  console.log("Botão de pagamento inicializado com sucesso!");
}

// Inicializar pagamento quando a página carregar
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM carregado, verificando botão de pagamento...");
  const botao = document.getElementById("botaoPagamentoRealizado");
  if (botao) {
    console.log("Botão encontrado, inicializando pagamento...");
    inicializarPagamento();
  } else {
    console.error("Botão de pagamento não encontrado!");
  }
});

// Também tentar inicializar após um pequeno delay (caso o DOMContentLoaded já tenha passado)
setTimeout(function() {
  if (document.getElementById("botaoPagamentoRealizado") && !document.getElementById("botaoPagamentoRealizado").hasAttribute('data-inicializado')) {
    console.log("Inicializando pagamento via timeout...");
    inicializarPagamento();
    document.getElementById("botaoPagamentoRealizado").setAttribute('data-inicializado', 'true');
  }
}, 500);







// Script específico para página de pagamento
    (function() {
      function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
          const cookies = document.cookie.split(';');
          for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
            }
          }
        }
        return cookieValue;
      }

      function finalizarPagamento() {
        const botao = document.getElementById('botaoPagamentoRealizado');
        if (!botao) {
          console.error('Botão não encontrado');
          return;
        }

        const mainElement = document.querySelector('.pagamentoContainer');
        if (!mainElement) {
          alert('Erro: Elemento não encontrado');
          return;
        }

        const reservaId = parseInt(mainElement.getAttribute('data-reserva-id'));
        if (isNaN(reservaId)) {
          alert('Erro: ID da reserva inválido');
          return;
        }

        const csrfToken = getCookie('csrftoken');
        if (!csrfToken) {
          alert('Erro: Token CSRF não encontrado. Recarregue a página.');
          return;
        }

        // Desabilitar botão
        botao.disabled = true;
        botao.textContent = 'Processando...';

        console.log('Enviando pagamento para reserva ID:', reservaId);

        fetch('/api/finalizar-pagamento/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          body: JSON.stringify({
            reserva_id: reservaId
          })
        })
        .then(response => {
          console.log('Status da resposta:', response.status);
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.message || 'Erro no servidor');
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Resposta:', data);
          if (data.success) {
            alert('Pagamento realizado com sucesso!');
            window.location.href = '/quartos/';
          } else {
            alert('Erro: ' + (data.message || 'Erro desconhecido'));
            botao.disabled = false;
            botao.textContent = 'Pagamento Realizado';
          }
        })
        .catch(error => {
          console.error('Erro:', error);
          alert('Erro ao processar pagamento: ' + error.message);
          botao.disabled = false;
          botao.textContent = 'Pagamento Realizado';
        });
      }

      // Aguardar DOM carregar
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          const botao = document.getElementById('botaoPagamentoRealizado');
          if (botao) {
            botao.addEventListener('click', finalizarPagamento);
            console.log('Botão de pagamento configurado!');
          }
        });
      } else {
        const botao = document.getElementById('botaoPagamentoRealizado');
        if (botao) {
          botao.addEventListener('click', finalizarPagamento);
          console.log('Botão de pagamento configurado!');
        }
      }
    })();

// Função para eliminar reserva
function eliminarReserva(reservaId) {
  if (!confirm('Tem certeza que deseja eliminar esta reserva?')) {
    return;
  }

  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    alert('Erro: Token CSRF não encontrado. Por favor, recarregue a página.');
    return;
  }

  const reservaCard = document.querySelector(`.reserva-card[data-reserva-id="${reservaId}"]`);
  if (reservaCard) {
    reservaCard.style.opacity = '0.5';
    reservaCard.style.pointerEvents = 'none';
  }

  fetch('/api/eliminar-reserva/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken
    },
    body: JSON.stringify({
      reserva_id: reservaId
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      if (reservaCard) {
        reservaCard.remove();
      }
      alert('Reserva eliminada com sucesso!');
      // Recarregar a página para atualizar a lista
      window.location.reload();
    } else {
      alert('Erro ao eliminar reserva: ' + (data.message || 'Erro desconhecido'));
      if (reservaCard) {
        reservaCard.style.opacity = '1';
        reservaCard.style.pointerEvents = 'auto';
      }
    }
  })
  .catch(error => {
    console.error('Erro:', error);
    alert('Erro ao conectar com o servidor. Tente novamente.');
    if (reservaCard) {
      reservaCard.style.opacity = '1';
      reservaCard.style.pointerEvents = 'auto';
    }
  });
}

// Configurar botões de eliminar reserva
function configurarBotoesEliminar() {
  const botoesEliminar = document.querySelectorAll('.reserva-botao-eliminar');
  console.log('Botões de eliminar encontrados:', botoesEliminar.length);
  
  botoesEliminar.forEach(botao => {
    // Verificar se já tem event listener para evitar duplicação
    if (botao.hasAttribute('data-listener-attached')) {
      return;
    }
    
    botao.setAttribute('data-listener-attached', 'true');
    
    botao.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const reservaId = this.getAttribute('data-reserva-id');
      console.log('Botão de eliminar clicado, reserva ID:', reservaId);
      if (reservaId) {
        eliminarReserva(parseInt(reservaId));
      } else {
        console.error('ID da reserva não encontrado no botão');
      }
    });
  });
}

// Executar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    configurarBotoesEliminar();
  });
} else {
  // DOM já carregado
  configurarBotoesEliminar();
}

// Também tentar após um pequeno delay (caso o conteúdo seja carregado dinamicamente)
setTimeout(configurarBotoesEliminar, 500);

// Função para ordenar quartos por preço
function ordenarQuartosPorPreco(ordem) {
  const container = document.getElementById('containerQuartos');
  if (!container) return;

  const quadrados = Array.from(container.querySelectorAll('.quadrado'));
  
  if (quadrados.length === 0) return;

  quadrados.sort((a, b) => {
    const precoA = parseFloat(a.getAttribute('data-preco')) || 0;
    const precoB = parseFloat(b.getAttribute('data-preco')) || 0;
    
    if (ordem === 'menor-maior') {
      return precoA - precoB;
    } else if (ordem === 'maior-menor') {
      return precoB - precoA;
    }
    return 0;
  });

  // Limpar container
  container.innerHTML = '';
  
  // Adicionar quadrados na nova ordem
  quadrados.forEach(quadrado => {
    container.appendChild(quadrado);
  });
}

// Configurar filtro de preço
function configurarFiltroPreco() {
  const filtroPreco = document.getElementById('filtroPreco');
  if (filtroPreco) {
    filtroPreco.addEventListener('change', function() {
      const ordem = this.value;
      if (ordem) {
        ordenarQuartosPorPreco(ordem);
      }
    });
  }
}

// Executar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', configurarFiltroPreco);
} else {
  configurarFiltroPreco();
}
