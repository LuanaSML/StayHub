

/**
 * INICIO -PARTE DAS COOKIES. Django usa para seguranca
 * busca o valor do cookie CSRF.
 */

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

/**
 * Função para obter o token CSRF necessário para requisições POST (cadastro, login, reserva)
 */
function getCsrfToken() {
  return getCookie("csrftoken");
}

/**
 * FINAL DAS COOKIES
 */










/**
 * MUDANCAS NO HEADERRRRR ESTAO AQUIII (logado ou nao diferenca de oq eles vem)
 */
function updateHeader(user) {
  const navDireita = document.querySelector(".direita");
  if (!navDireita) return;

  if (user) {
    // Usuário logado - mostrar nome e botão sair
    navDireita.innerHTML = `
            <span class="usuario-logado" id="btnMudarNome" style="cursor: pointer;">Olá, ${user.first_name}</span>
            <a class="sair" href="#" id="btnLogout">SAIR</a>
        `;

    // Adicionar evento (acao) ao botão de sair
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

/**
 * FINAL DAs mudancas no header
 */












/**
 * MENSAGEMS DE ERROOOOOOOOOOOOOOOOOOOOOOOO
 * 
 * ERROS NO CADASTRO E LOGIN (NO POPUP)
 */

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


/**
 * Mostra uma mensagem de erro na página de reserva por isso a funcao
 */
function mostrarErroReserva(mensagem) {
  const mensagemErro = document.getElementById("mensagemErroReserva");
  if (mensagemErro) {
    mensagemErro.textContent = mensagem;
    mensagemErro.style.display = "block";
  }
}

/**
 * FINAL das msgs de erro
 */
















/**
 * INICIO DEFUNCOES DE AUTENTICACAO DO LOGIN, CADASTRO, E LOGOUT 
 *
 * 
 * Quando o usuário preenche o formulário de cadastro e
 * clica em REGISTRAR, esta função envia os dados para o servidor e cria
 * a conta no banco de dados.
 */
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




/**
 * loginnnnnnnnnnnnnnnnnn na cintaaaaaaaaaaaa
 * 
 * Quando o usuário preenche o formulário de login e
 * clica em ENTRAR, esta função autentica o usuário no servidor e cria
 * uma sessão de login.
 */
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




/**
 * LOGOUTTTTTTTTTTTTT NA CONTAAAAAAAAAAAAAAAAAAAAAAAA
 * 
 *Quando o usuário clica no botão SAIR, esta função
 * encerra a sessão do usuario no servidor e atualiza o header
 */


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




/**
 * BOTOES QUE ABREM OS POPUPS DE CADASTRO E LOGIN 
 * 
 */

function setupPopupButtons() {
  const overlayCadastro = document.getElementById("popupoverlay");
  const overlayLogin = document.getElementById("popupoverlay-login");
  const btnCadastro = document.getElementById("btnCadastro");
  const btnLogin = document.getElementById("btnLogin");

  // Abrir popup de cadastro
  if (btnCadastro && overlayCadastro) {
    btnCadastro.addEventListener("click", function (e) {
      e.preventDefault();
      overlayCadastro.classList.add("active");
    });
  }

  // Abrir popup de login
  if (btnLogin && overlayLogin) {
    btnLogin.addEventListener("click", function (e) {
      e.preventDefault();
      overlayLogin.classList.add("active");
    });
  }
}















/**
 * MUDAR NOME DE USUARIOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO 
 * Envia requisição para mudar o nome do usuário
 * 
 * Quando o usuário clica no nome no header e escolhe
 * mudar o nome, esta função atualiza o nome no banco de dados.
 */
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


















/**
 * FUNCOES DA PARTE DE RESERVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARESERVAAAAAAAA
 *
 * 
 * Quando o usuário preenche o formulário de reserva na
 * página de detalhe do quarto e clica em reservar, esta função cria a
 * reserva no banco de dados e redireciona para a página de pagamento.
 */
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

/**
 * ELIMINAR RESERVAAAVAVAVAVAVAVAVAVA
 */

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




/**
 * BOTOES DE ELIMINAR RESERVA 
 * 
 *Quando a página de quartos reservados carrega, esta
 * função encontra todos os botões de eliminar (ícone de lixeira) e adiciona
 * event listeners para que funcionem quando clicados.
 */
 function configurarBotoesEliminar() {
  const botoesEliminar = document.querySelectorAll('.reserva-botao-eliminar');
  
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
      if (reservaId) {
        eliminarReserva(parseInt(reservaId));
      }
    });
  });
}













/**
 * botão de pagamento na página de PAGAMENTOOOOOOOO
 * 
 * marca reserva
 * Esta função verifica se já foi inicializada para evitar adicionar
 * múltiplos event listeners ao mesmo botão.
 */

function inicializarPagamento() {
  const botaoPagamento = document.getElementById("botaoPagamentoRealizado");

  if (!botaoPagamento) {
    return;
  }

  // Verificar se já foi inicializado para evitar duplicação
  if (botaoPagamento.hasAttribute('data-inicializado')) {
    return;
  }

  const mainElement = document.querySelector(".pagamentoContainer");
  if (!mainElement) {
    return;
  }

  const reservaId = parseInt(mainElement.getAttribute("data-reserva-id"));
  if (isNaN(reservaId)) {
    return;
  }


  // Adicionar event listener ao botão (espera que evento aconteca)
  botaoPagamento.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    const csrfToken = getCsrfToken();

    if (!csrfToken) {
      alert("Erro: Token CSRF não encontrado. Por favor, recarregue a página.");
      return;
    }

    // Desabilitar botão para evitar cliques múltiplos
    botaoPagamento.disabled = true;
    botaoPagamento.textContent = "Processando...";

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
        if (!response.ok) {
          throw new Error("Erro na resposta do servidor: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
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
        alert("Erro ao conectar com o servidor. Por favor, tente novamente.");
        botaoPagamento.disabled = false;
        botaoPagamento.textContent = "Pagamento Realizado";
      });
  });
  
  // Marcar como inicializado
  botaoPagamento.setAttribute('data-inicializado', 'true');
}











/**
 * FUNCOES DO FILTROOOOOOOOOOOOOOOOOOOOOOO DA HOME
 * 
 */

function ordenarQuartosPorPreco(ordem) {
  const container = document.getElementById('containerQuartos');
  if (!container) return;

  const quadrados = Array.from(container.querySelectorAll('.quadrado'));
  
  if (quadrados.length === 0) return;

  // Ordenar baseado no atributo data-preco
  quadrados.sort((a, b) => {
    const precoA = parseFloat(a.getAttribute('data-preco')) || 0;
    const precoB = parseFloat(b.getAttribute('data-preco')) || 0;
    
    if (ordem === 'menor-maior') {
      return precoA - precoB; // Ordem crescente
    } else if (ordem === 'maior-menor') {
      return precoB - precoA; // Ordem decrescente
    }
    return 0;
  });

  // Limpar container e adicionar quadrados na nova ordem
  container.innerHTML = '';
  quadrados.forEach(quadrado => {
    container.appendChild(quadrado);
  });
}



/**
 * CONFIGURA O FILTRO DO PRECO
 * 
 * Quando a página home carrega, esta função encontra o
 * select de filtro de preço e adiciona um event listener para que quando o
 * usuário mudar a opção, os quartos sejam reordenados.
 */
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















/**
 * INICIALIZAÇÃO - CONFIGURAÇÃO QUANDO A PÁGINA CARREGA
 * 
 * Quando o HTML da página termina de carregar, este código
 * configura todos os event listeners necessários: popups, formulários,
 * botões, etc. Tudo que precisa funcionar na página é configurado aqui.
 */


document.addEventListener("DOMContentLoaded", function () {
  // ===== ELEMENTOS DOS POPUPS =====
  const overlayCadastro = document.getElementById("popupoverlay");
  const overlayLogin = document.getElementById("popupoverlay-login");
  const overlayMudarNome = document.getElementById("popupoverlay-mudar-nome");

  // ===== BOTÕES QUE ABREM OS POPUPS =====
  const btnCadastro = document.getElementById("btnCadastro");
  const btnLogin = document.getElementById("btnLogin");
  const btnMudarNome = document.getElementById("btnMudarNome");

  // ===== BOTÕES QUE FECHAM OS POPUPS (X) =====
  const btnXCadastro = document.getElementById("popupX");
  const btnXLogin = document.getElementById("popupX-login");
  const btnXMudarNome = document.getElementById("popupX-mudar-nome");

  // ===== CONFIGURAR BOTÕES DE ABRIR POPUPS =====
  setupPopupButtons();

  // ===== FECHAR POPUP DE CADASTRO COM X =====
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

  // ===== FECHAR POPUP DE LOGIN COM X =====
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

  // ===== ABRIR POPUP DE MUDAR NOME =====
  if (btnMudarNome && overlayMudarNome) {
    btnMudarNome.addEventListener("click", function (e) {
      e.preventDefault();
      overlayMudarNome.classList.add("active");
    });
  }

  // ===== FECHAR POPUP DE MUDAR NOME COM X =====
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

  // ===== FECHAR POPUPS AO CLICAR FORA DELES =====
  // Quando o usuário clica na área escura ao redor do popup, fecha o popup
  if (overlayCadastro) {
    overlayCadastro.addEventListener("click", function (e) {
      if (e.target === overlayCadastro) {
        overlayCadastro.classList.remove("active");
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

  // ===== PREVENIR FECHAR POPUP AO CLICAR DENTRO =====
  // Quando o usuário clica dentro do conteúdo do popup, não fecha
  const modalContents = document.querySelectorAll(".modal-content");
  modalContents.forEach(function (mc) {
    mc.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  });

  // ===== FORMULÁRIO DE CADASTRO =====
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

  // ===== FORMULÁRIO DE LOGIN =====
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

  // ===== BOTÃO DE LOGOUT =====
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", function (e) {
      e.preventDefault();
      fazerLogout();
    });
  }

  // ===== FORMULÁRIO DE MUDAR NOME =====
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

  // ===== BOTÃO MANTER NOME (fecha popup sem mudar) =====
  const btnManterNome = document.getElementById("btnManterNome");
  if (btnManterNome && overlayMudarNome) {
    btnManterNome.addEventListener("click", function (e) {
      e.preventDefault();
      overlayMudarNome.classList.remove("active");
    });
  }

  // ===== FORMULÁRIO DE RESERVA =====
  const formReserva = document.getElementById("formReserva");
  if (formReserva) {
    formReserva.addEventListener("submit", function (e) {
      e.preventDefault();

      // Verificar se está logado
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












/**
 * INICIALIZA BOTAO DE PAGAMENTO QUANDO A PAGINA CARREGA
 * 
 * 
 * A página de pagamento precisa de uma inicialização
 * separada porque o botão só existe nessa página. Esta função verifica se
 * o botão existe e o configura.
 */

document.addEventListener("DOMContentLoaded", function () {
  const botao = document.getElementById("botaoPagamentoRealizado");
  if (botao) {
    inicializarPagamento();
  }
});

//Inicializa os BOTOES DE ELIMIANR RESERVA 


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    configurarBotoesEliminar();
  });
} else {
  // DOM já carregado
  configurarBotoesEliminar();
}

// Tentar novamente após um delay (caso o conteúdo seja carregado dinamicamente)
setTimeout(configurarBotoesEliminar, 500);

//Inicializa o filtro de preço quando a página home carrega
 
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', configurarFiltroPreco);
} else {
  configurarFiltroPreco();
}
