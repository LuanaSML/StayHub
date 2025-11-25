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
  fetch("/api/logout/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Atualizar header
        updateHeader(null);
        // Recarregar página
        window.location.reload();
      }
    })
    .catch((error) => {
      console.error("Erro ao fazer logout:", error);
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

  // Buttons that open modals
  const btnCadastro = document.getElementById("btnCadastro");
  const btnLogin = document.getElementById("btnLogin");

  // Close buttons
  const btnXCadastro = document.getElementById("popupX");
  const btnXLogin = document.getElementById("popupX-login");

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

  const mainElement = document.querySelector(".pagamento-main");
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
