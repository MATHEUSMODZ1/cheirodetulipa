// ========== CONFIGURAÇÕES ==========
const CONFIG = {
    telefone: '5511958289399',
    siteNome: 'Cheiro de Tulipa',
    recaptchaKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
};

// ========== ESTADO GLOBAL ==========
let produtos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let configuracoes = {};
let recaptchaValidado = false;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarConfiguracoes();
    carregarProdutos();
    atualizarCarrinhoCount();
    verificarPromocao24h();
    verificarManutencao();
});

// ========== CARREGAR CONFIGURAÇÕES ==========
async function carregarConfiguracoes() {
    try {
        const response = await fetch('configuracoes.json');
        configuracoes = await response.json();
        
        // Aplicar cores do tema
        document.documentElement.style.setProperty('--primary', configuracoes.site.cor_primaria);
        document.documentElement.style.setProperty('--secondary', configuracoes.site.cor_secundaria);
        
        // Atualizar telefone
        CONFIG.telefone = configuracoes.site.telefone;
        
        // Verificar modo manutenção
        if (configuracoes.site.modo_manutencao) {
            ativarModoManutencao();
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

// ========== MODO MANUTENÇÃO ==========
function ativarModoManutencao() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div style="text-align: center; padding: 100px 20px;">
            <i class="fas fa-tools" style="font-size: 80px; color: var(--primary); margin-bottom: 30px;"></i>
            <h1 style="font-size: 32px; color: var(--text); margin-bottom: 20px;">${configuracoes.site.mensagem_manutencao}</h1>
            <p style="color: var(--text-light);">Voltamos em breve com novidades!</p>
        </div>
    `;
}

// ========== CARREGAR PRODUTOS ==========
async function carregarProdutos() {
    try {
        const response = await fetch('produtos.json');
        const data = await response.json();
        produtos = data.produtos;
        
        // Carregar destaques na tela inicial
        carregarDestaques();
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        mostrarAlerta('Erro ao carregar produtos', 'error');
    }
}

// ========== CARREGAR DESTAQUES ==========
function carregarDestaques() {
    const container = document.getElementById('produtos-destaque');
    if (!container) return;
    
    const destaques = produtos.filter(p => p.destaque === true).slice(0, 4);
    
    if (destaques.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Nenhum produto em destaque</p></div>';
        return;
    }
    
    container.innerHTML = '';
    
    destaques.forEach(produto => {
        container.appendChild(criarCardProduto(produto));
    });
}

// ========== CRIAR CARD DE PRODUTO ==========
function criarCardProduto(produto) {
    const card = document.createElement('div');
    card.className = 'produto-card';
    
    const imagemPath = produto.imagem ? `uploads/${produto.imagem}` : 'https://via.placeholder.com/300x200/6d28d9/ffffff?text=Cheiro+de+Tulipa';
    
    let precoHTML = '';
    let tagPromo = '';
    
    if (produto.em_promocao && produto.preco_promocional > 0) {
        precoHTML = `
            <div class="produto-preco-container">
                <span class="produto-preco-original">R$ ${produto.preco_original.toFixed(2)}</span>
                <span class="produto-preco">R$ ${produto.preco_promocional.toFixed(2)}</span>
            </div>
        `;
        tagPromo = '<span class="produto-tag-promo"><i class="fas fa-bolt"></i> PROMO</span>';
    } else {
        precoHTML = `<div class="produto-preco">R$ ${produto.preco_original.toFixed(2)}</div>`;
    }
    
    card.innerHTML = `
        <div class="produto-imagem" style="background-image: url('${imagemPath}'); position: relative;">
            ${tagPromo}
            ${produto.destaque ? '<span class="produto-tag">Destaque</span>' : ''}
            <button class="btn-exibir" onclick="event.stopPropagation(); abrirPreview('${imagemPath}', '${produto.nome}')">
                <i class="fas fa-search-plus"></i> Exibir
            </button>
        </div>
        <div class="produto-info">
            <h3 class="produto-nome">${produto.nome}</h3>
            <p class="produto-descricao">${produto.descricao.substring(0, 80)}...</p>
            ${precoHTML}
            <button class="btn-comprar" onclick="adicionarAoCarrinho(${produto.id})">
                <i class="fas fa-cart-plus"></i> Adicionar
            </button>
        </div>
    `;
    
    // Também pode clicar na imagem para abrir preview
    const imagemDiv = card.querySelector('.produto-imagem');
    imagemDiv.style.cursor = 'pointer';
    imagemDiv.addEventListener('click', () => {
        abrirPreview(imagemPath, produto.nome);
    });
    
    return card;
}

// ========== VERIFICAR PROMOÇÃO 24H ==========
function verificarPromocao24h() {
    const banner = document.getElementById('promo-banner');
    if (!banner) return;
    
    if (configuracoes.promocoes_24h && configuracoes.promocoes_24h.ativa) {
        const msg = document.getElementById('promo-mensagem');
        msg.innerHTML = `<i class="fas ${configuracoes.promocoes_24h.icone}"></i> ${configuracoes.promocoes_24h.mensagem}`;
        banner.style.display = 'flex';
    } else {
        banner.style.display = 'none';
    }
}

function fecharBanner() {
    document.getElementById('promo-banner').style.display = 'none';
}

// ========== SIDEBAR ==========
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const hamburger = document.querySelector('.hamburger-btn');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    hamburger.classList.toggle('active');
}

function fecharSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const hamburger = document.querySelector('.hamburger-btn');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    hamburger.classList.remove('active');
}

// ========== NAVEGAÇÃO ==========
function mostrarInicial() {
    document.getElementById('welcome-screen').style.display = 'block';
    document.getElementById('products-screen').style.display = 'none';
}

function carregarCategoria(categoria) {
    const titulos = {
        'velas': 'Velas Aromáticas',
        'sabonetes': 'Sabonetes Artesanais',
        'sabonetes-liquidos': 'Sabonetes Líquidos',
        'kits': 'Kits e Presentes',
        'promocoes': 'Promoções Especiais'
    };
    
    document.getElementById('categoria-titulo').textContent = titulos[categoria] || categoria;
    
    let produtosFiltrados = [];
    
    if (categoria === 'promocoes') {
        produtosFiltrados = produtos.filter(p => p.em_promocao === true);
    } else {
        produtosFiltrados = produtos.filter(p => p.categoria === categoria);
    }
    
    const container = document.getElementById('produtos-container');
    
    if (produtosFiltrados.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Nenhum produto encontrado</p></div>';
    } else {
        container.innerHTML = '';
        produtosFiltrados.forEach(produto => {
            container.appendChild(criarCardProduto(produto));
        });
    }
    
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('products-screen').style.display = 'block';
}

// ========== CARRINHO ==========
function toggleCarrinho() {
    const modal = document.getElementById('carrinho-modal');
    modal.classList.toggle('active');
}

function adicionarAoCarrinho(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
    
    const precoFinal = (produto.em_promocao && produto.preco_promocional > 0) 
        ? produto.preco_promocional 
        : produto.preco_original;
    
    const itemExistente = carrinho.find(item => item.id === produtoId);
    
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: precoFinal,
            quantidade: 1
        });
    }
    
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinhoCount();
    atualizarCarrinhoModal();
    mostrarAlerta(`${produto.nome} adicionado ao carrinho!`);
}

function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter(item => item.id !== produtoId);
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinhoCount();
    atualizarCarrinhoModal();
}

function atualizarCarrinhoCount() {
    const count = carrinho.reduce((total, item) => total + item.quantidade, 0);
    document.getElementById('carrinho-count').textContent = count;
}

function atualizarCarrinhoModal() {
    const container = document.getElementById('carrinho-items');
    const totalElement = document.getElementById('carrinho-total');
    const btnFinalizar = document.getElementById('btn-finalizar');
    
    if (carrinho.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Carrinho vazio</p></div>';
        totalElement.textContent = 'R$ 0,00';
        btnFinalizar.disabled = true;
        return;
    }
    
    let html = '';
    let total = 0;
    
    carrinho.forEach(item => {
        total += item.preco * item.quantidade;
        html += `
            <div class="carrinho-item">
                <div class="carrinho-item-info">
                    <h4>${item.nome}</h4>
                    <p>${item.quantidade}x R$ ${item.preco.toFixed(2)}</p>
                </div>
                <div>
                    <span class="carrinho-item-preco">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                    <button class="btn-remover" onclick="removerDoCarrinho(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    totalElement.textContent = `R$ ${total.toFixed(2)}`;
    btnFinalizar.disabled = !recaptchaValidado;
}

// ========== RECAPTCHA ==========
function onRecaptchaSuccess() {
    recaptchaValidado = true;
    document.getElementById('btn-finalizar').disabled = false;
    mostrarAlerta('RECAPTCHA VALIDADO!', 'success');
}

function onRecaptchaExpired() {
    recaptchaValidado = false;
    document.getElementById('btn-finalizar').disabled = true;
    mostrarAlerta('reCAPTCHA expirado. Marque novamente.', 'warning');
}

// ========== FINALIZAR COMPRA ==========
function finalizarCompra() {
    if (carrinho.length === 0) {
        mostrarAlerta('Carrinho vazio!', 'error');
        return;
    }
    
    if (!recaptchaValidado) {
        mostrarAlerta('Por favor, confirme o reCAPTCHA', 'warning');
        return;
    }
    
    let mensagem = `🌸 *CHEIRO DE TULIPA* - NOVO PEDIDO 🌸\n\n`;
    let total = 0;
    
    carrinho.forEach(item => {
        mensagem += `• ${item.nome} - ${item.quantidade}x R$ ${item.preco.toFixed(2)}\n`;
        total += item.preco * item.quantidade;
    });
    
    mensagem += `\n💰 *TOTAL: R$ ${total.toFixed(2)}*`;
    mensagem += `\n\n📦 Forma de pagamento: A combinar`;
    mensagem += `\n\nObrigado pela preferência! 🌷`;
    
    const url = `https://wa.me/${CONFIG.telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
    
    // Limpar carrinho
    carrinho = [];
    localStorage.removeItem('carrinho');
    atualizarCarrinhoCount();
    atualizarCarrinhoModal();
    recaptchaValidado = false;
    
    // Reset reCAPTCHA
    if (typeof grecaptcha !== 'undefined') {
        grecaptcha.reset();
    }
}

// ========== ALERTAS ==========
function mostrarAlerta(mensagem, tipo = 'success') {
    const alerta = document.getElementById('alert-toast');
    const msgSpan = document.getElementById('alert-message');
    const icon = alerta.querySelector('i');
    
    msgSpan.textContent = mensagem;
    
    if (tipo === 'success') {
        icon.style.color = '#10b981';
        alerta.style.borderColor = '#10b981';
    } else if (tipo === 'error') {
        icon.style.color = '#ef4444';
        alerta.style.borderColor = '#ef4444';
        icon.className = 'fas fa-exclamation-circle';
    } else {
        icon.style.color = '#f59e0b';
        alerta.style.borderColor = '#f59e0b';
        icon.className = 'fas fa-exclamation-triangle';
    }
    
    alerta.classList.add('show');
    
    setTimeout(() => {
        alerta.classList.remove('show');
        icon.className = 'fas fa-check-circle';
    }, 3000);
}

// ========== FECHAR MODAIS AO CLICAR FORA ==========
window.onclick = function(event) {
    const carrinhoModal = document.getElementById('carrinho-modal');
    const sidebar = document.getElementById('sidebar');
    
    if (!carrinhoModal.contains(event.target) && 
        !event.target.closest('.carrinho-btn') && 
        carrinhoModal.classList.contains('active')) {
        carrinhoModal.classList.remove('active');
    }
    
    if (!sidebar.contains(event.target) && 
        !event.target.closest('.hamburger-btn') && 
        sidebar.classList.contains('active')) {
        fecharSidebar();
    }
}

// ========== PREVIEW DE IMAGEM ==========
function abrirPreview(imagemSrc, nomeProduto) {
    const modal = document.getElementById('preview-modal');
    const previewImg = document.getElementById('preview-image');
    const caption = document.getElementById('preview-caption');
    
    previewImg.src = imagemSrc;
    caption.textContent = nomeProduto;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Impede rolagem da página
}

function fecharPreview() {
    const modal = document.getElementById('preview-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaura rolagem
}

// Fechar com tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharPreview();
    }
});