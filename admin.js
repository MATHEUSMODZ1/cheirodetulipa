// ========== VARIÁVEIS GLOBAIS ==========
let produtos = [];
let produtosFiltrados = [];
let configuracoes = {};
let logs = [];
let graficoCategorias = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    
    // Login form
    document.getElementById('login-form').addEventListener('submit', fazerLogin);
});

// ========== API CALLS ==========
async function apiGet(endpoint) {
    try {
        const response = await fetch(`/api${endpoint}`);
        return await response.json();
    } catch (error) {
        console.error('Erro na requisição GET:', error);
        mostrarAlerta('Erro de conexão com o servidor', 'error');
        return null;
    }
}

async function apiPost(endpoint, data, isFormData = false) {
    try {
        const options = {
            method: 'POST',
            body: isFormData ? data : JSON.stringify(data),
            headers: isFormData ? {} : { 'Content-Type': 'application/json' }
        };
        const response = await fetch(`/api${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('Erro na requisição POST:', error);
        mostrarAlerta('Erro de conexão com o servidor', 'error');
        return null;
    }
}

async function apiPut(endpoint, data, isFormData = false) {
    try {
        const options = {
            method: 'PUT',
            body: isFormData ? data : JSON.stringify(data),
            headers: isFormData ? {} : { 'Content-Type': 'application/json' }
        };
        const response = await fetch(`/api${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('Erro na requisição PUT:', error);
        mostrarAlerta('Erro de conexão com o servidor', 'error');
        return null;
    }
}

async function apiDelete(endpoint) {
    try {
        const response = await fetch(`/api${endpoint}`, { method: 'DELETE' });
        return await response.json();
    } catch (error) {
        console.error('Erro na requisição DELETE:', error);
        mostrarAlerta('Erro de conexão com o servidor', 'error');
        return null;
    }
}

// ========== CARREGAR DADOS ==========
async function carregarDados() {
    try {
        // Carregar produtos
        const dataProdutos = await apiGet('/produtos');
        if (dataProdutos) produtos = dataProdutos.produtos || [];
        
        // Carregar configurações
        const dataConfig = await apiGet('/configuracoes');
        if (dataConfig) configuracoes = dataConfig;
        
        // Carregar logs
        const dataLogs = await apiGet('/logs');
        if (dataLogs) logs = dataLogs.logs || [];
        
        // Atualizar interface
        atualizarDashboard();
        atualizarTabelaProdutos();
        atualizarTabelaPromocoes();
        carregarConfiguracoesForm();
        atualizarLogs();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarAlerta('Erro ao carregar dados', 'error');
    }
}

// ========== LOGIN ==========
async function fazerLogin(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;
    
    // Verificar com configurações carregadas
    if (usuario === configuracoes.admin?.usuario && senha === configuracoes.admin?.senha) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('admin-nome').textContent = usuario;
        
        await registrarLog('Login realizado');
        mostrarAlerta('Login realizado com sucesso!', 'success');
    } else {
        mostrarAlerta('Usuário ou senha incorretos!', 'error');
    }
}

function logout() {
    registrarLog('Logout realizado');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
}

// ========== MENU ==========
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menu-overlay');
    const icon = document.querySelector('.menu-toggle i');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    if (sidebar.classList.contains('active')) {
        icon.className = 'fas fa-times';
    } else {
        icon.className = 'fas fa-bars';
    }
}

function mostrarSecao(secao) {
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
    });
    
    document.querySelectorAll('.sidebar-menu a').forEach(l => {
        l.classList.remove('active');
    });
    
    document.getElementById(secao).classList.add('active');
    document.getElementById(`link-${secao}`).classList.add('active');
    
    // Fechar menu no mobile
    if (window.innerWidth <= 768) {
        toggleMenu();
    }
}

// ========== REGISTRAR LOG ==========
async function registrarLog(acao) {
    const novoLog = {
        usuario: document.getElementById('admin-nome').textContent || 'admin',
        acao: acao,
        ip: '127.0.0.1'
    };
    
    await apiPost('/logs', novoLog);
}

// ========== DASHBOARD ==========
async function atualizarDashboard() {
    try {
        const stats = await apiGet('/estatisticas');
        
        if (stats) {
            document.getElementById('total-produtos').textContent = stats.total || 0;
            document.getElementById('total-promocoes').textContent = stats.promocoes || 0;
            document.getElementById('total-destaques').textContent = stats.destaques || 0;
            document.getElementById('total-estoque').textContent = stats.estoque || 0;
            
            // Gráfico de categorias
            const ctx = document.getElementById('grafico-categorias')?.getContext('2d');
            if (ctx) {
                if (graficoCategorias) graficoCategorias.destroy();
                
                graficoCategorias = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Velas', 'Sabonetes', 'Sabonetes Líquidos', 'Kits'],
                        datasets: [{
                            data: [
                                stats.categorias?.velas || 0,
                                stats.categorias?.sabonetes || 0,
                                stats.categorias?.['sabonetes-liquidos'] || 0,
                                stats.categorias?.kits || 0
                            ],
                            backgroundColor: ['#6d28d9', '#8b5cf6', '#f59e0b', '#10b981'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }
        }
        
        // Últimos logs
        const ultimosLogs = logs.slice(-5).reverse();
        const logsHtml = document.getElementById('ultimos-logs');
        
        if (ultimosLogs.length === 0) {
            logsHtml.innerHTML = '<p class="text-muted">Nenhum log registrado</p>';
        } else {
            logsHtml.innerHTML = ultimosLogs.map(log => `
                <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--gray-200);">
                    <small style="color: var(--gray-400);">${new Date(log.data).toLocaleString()}</small>
                    <p><strong>${log.usuario}</strong> - ${log.acao}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
    }
}

// ========== PRODUTOS ==========
function atualizarTabelaProdutos() {
    const tbody = document.getElementById('tabela-produtos');
    const filtroCategoria = document.getElementById('filtro-categoria')?.value || 'todas';
    const filtroStatus = document.getElementById('filtro-status')?.value || 'todos';
    const busca = document.getElementById('busca-produto')?.value.toLowerCase() || '';
    
    produtosFiltrados = produtos.filter(p => {
        const matchCategoria = filtroCategoria === 'todas' || p.categoria === filtroCategoria;
        const matchStatus = filtroStatus === 'todos' || 
            (filtroStatus === 'promocao' && p.em_promocao) ||
            (filtroStatus === 'destaque' && p.destaque);
        const matchBusca = p.nome.toLowerCase().includes(busca) || p.descricao.toLowerCase().includes(busca);
        return matchCategoria && matchStatus && matchBusca;
    });
    
    if (produtosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Nenhum produto encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = produtosFiltrados.map(p => `
        <tr>
            <td>#${p.id}</td>
            <td>
                <div class="produto-imagem-tabela" style="background-image: url('uploads/${p.imagem || 'placeholder.jpg'}')"></div>
            </td>
            <td>${p.nome}</td>
            <td>${formatarCategoria(p.categoria)}</td>
            <td>R$ ${p.preco_original?.toFixed(2) || '0.00'}</td>
            <td>${p.em_promocao ? `R$ ${p.preco_promocional?.toFixed(2)}` : '-'}</td>
            <td>${p.estoque || 0}</td>
            <td>
                ${p.em_promocao ? '<span class="status-badge status-promocao">Promo</span>' : ''}
                ${p.destaque ? '<span class="status-badge status-destaque">Destaque</span>' : ''}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editarProduto(${p.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deletarProduto(${p.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filtrarProdutos() {
    atualizarTabelaProdutos();
}

function formatarCategoria(cat) {
    const categorias = {
        'velas': 'Velas',
        'sabonetes': 'Sabonetes',
        'sabonetes-liquidos': 'Sabonetes Líquidos',
        'kits': 'Kits'
    };
    return categorias[cat] || cat;
}

function abrirModalProduto() {
    document.getElementById('modal-produto-titulo').textContent = 'Novo Produto';
    document.getElementById('form-produto').reset();
    document.getElementById('produto-id').value = '';
    document.getElementById('campo-preco-promocional').style.display = 'none';
    document.getElementById('imagem-preview').innerHTML = '';
    document.getElementById('modal-produto').style.display = 'block';
}

function fecharModalProduto() {
    document.getElementById('modal-produto').style.display = 'none';
}

function togglePromocaoProduto() {
    const isPromocao = document.getElementById('produto-em-promocao').checked;
    document.getElementById('campo-preco-promocional').style.display = isPromocao ? 'block' : 'none';
}

function editarProduto(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;
    
    document.getElementById('modal-produto-titulo').textContent = 'Editar Produto';
    document.getElementById('produto-id').value = produto.id;
    document.getElementById('produto-nome').value = produto.nome;
    document.getElementById('produto-descricao').value = produto.descricao;
    document.getElementById('produto-categoria').value = produto.categoria;
    document.getElementById('produto-preco-original').value = produto.preco_original;
    document.getElementById('produto-estoque').value = produto.estoque || 0;
    document.getElementById('produto-em-promocao').checked = produto.em_promocao || false;
    document.getElementById('produto-preco-promocional').value = produto.preco_promocional || 0;
    document.getElementById('produto-destaque').checked = produto.destaque || false;
    
    togglePromocaoProduto();
    
    if (produto.imagem && produto.imagem !== 'placeholder.jpg') {
        document.getElementById('imagem-preview').innerHTML = `
            <img src="uploads/${produto.imagem}" alt="Preview">
        `;
    }
    
    document.getElementById('modal-produto').style.display = 'block';
}

async function salvarProduto(event) {
    event.preventDefault();
    
    const id = document.getElementById('produto-id').value;
    const formData = new FormData();
    
    formData.append('nome', document.getElementById('produto-nome').value);
    formData.append('descricao', document.getElementById('produto-descricao').value);
    formData.append('categoria', document.getElementById('produto-categoria').value);
    formData.append('preco_original', document.getElementById('produto-preco-original').value);
    formData.append('estoque', document.getElementById('produto-estoque').value);
    formData.append('em_promocao', document.getElementById('produto-em-promocao').checked);
    formData.append('preco_promocional', document.getElementById('produto-preco-promocional').value || '0');
    formData.append('destaque', document.getElementById('produto-destaque').checked);
    
    const imagemInput = document.getElementById('produto-imagem');
    if (imagemInput.files.length > 0) {
        formData.append('imagem', imagemInput.files[0]);
    }
    
    let response;
    if (id) {
        response = await apiPut(`/produtos/${id}`, formData, true);
        if (response?.success) {
            await registrarLog(`Produto atualizado: ${document.getElementById('produto-nome').value}`);
            mostrarAlerta('Produto atualizado com sucesso!', 'success');
        }
    } else {
        response = await apiPost('/produtos', formData, true);
        if (response?.success) {
            await registrarLog(`Produto adicionado: ${document.getElementById('produto-nome').value}`);
            mostrarAlerta('Produto criado com sucesso!', 'success');
        }
    }
    
    if (response?.success) {
        await carregarDados();
        fecharModalProduto();
    }
}

async function deletarProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        const response = await apiDelete(`/produtos/${id}`);
        if (response?.success) {
            const produto = produtos.find(p => p.id === id);
            await registrarLog(`Produto excluído: ${produto?.nome}`);
            mostrarAlerta('Produto excluído com sucesso!', 'success');
            await carregarDados();
        }
    }
}

// ========== PROMOÇÕES ==========
function atualizarTabelaPromocoes() {
    const tbody = document.getElementById('tabela-promocoes');
    const promocoes = produtos.filter(p => p.em_promocao);
    
    if (promocoes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum produto em promoção</td></tr>';
        return;
    }
    
    tbody.innerHTML = promocoes.map(p => {
        const desconto = p.preco_original && p.preco_promocional 
            ? ((p.preco_original - p.preco_promocional) / p.preco_original * 100).toFixed(0)
            : 0;
        return `
            <tr>
                <td>#${p.id}</td>
                <td>${p.nome}</td>
                <td>R$ ${p.preco_original?.toFixed(2)}</td>
                <td>R$ ${p.preco_promocional?.toFixed(2)}</td>
                <td>${desconto}% OFF</td>
                <td>
                    <button class="btn-edit" onclick="editarProduto(${p.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function togglePromocao24h() {
    const ativa = document.getElementById('promo-ativa').checked;
    document.getElementById('promo-status').textContent = ativa ? 'Ativada' : 'Desativada';
}

async function salvarPromocao24h() {
    configuracoes.promocoes_24h = {
        ativa: document.getElementById('promo-ativa').checked,
        mensagem: document.getElementById('promo-mensagem').value,
        desconto_global: parseInt(document.getElementById('promo-desconto').value),
        icone: document.getElementById('promo-icone').value
    };
    
    const response = await apiPost('/configuracoes', configuracoes);
    if (response?.success) {
        await registrarLog('Promoção 24h atualizada');
        mostrarAlerta('Configurações de promoção salvas!', 'success');
    }
}

// ========== CONFIGURAÇÕES ==========
function carregarConfiguracoesForm() {
    document.getElementById('config-nome').value = configuracoes.site?.nome || 'Cheiro de Tulipa';
    document.getElementById('config-telefone').value = configuracoes.site?.telefone || '5511999999999';
    document.getElementById('config-email').value = configuracoes.site?.email || 'contato@cheirodetulipa.com';
    document.getElementById('config-cor-primaria').value = configuracoes.site?.cor_primaria || '#6d28d9';
    document.getElementById('config-cor-secundaria').value = configuracoes.site?.cor_secundaria || '#8b5cf6';
    document.getElementById('config-usuario').value = configuracoes.admin?.usuario || 'admin';
    document.getElementById('modo-manutencao').checked = configuracoes.site?.modo_manutencao || false;
    document.getElementById('mensagem-manutencao').value = configuracoes.site?.mensagem_manutencao || 'Site em manutenção. Voltamos em breve!';
    
    // Promoções
    if (configuracoes.promocoes_24h) {
        document.getElementById('promo-ativa').checked = configuracoes.promocoes_24h.ativa || false;
        document.getElementById('promo-mensagem').value = configuracoes.promocoes_24h.mensagem || '🔥 Promoção relâmpago: 15% OFF em todos os produtos!';
        document.getElementById('promo-desconto').value = configuracoes.promocoes_24h.desconto_global || 15;
        document.getElementById('promo-icone').value = configuracoes.promocoes_24h.icone || 'fa-bolt';
        document.getElementById('promo-status').textContent = configuracoes.promocoes_24h.ativa ? 'Ativada' : 'Desativada';
    }
    
    document.getElementById('manutencao-status').textContent = 
        configuracoes.site?.modo_manutencao ? 'Ativado' : 'Desativado';
}

function toggleManutencao() {
    const ativa = document.getElementById('modo-manutencao').checked;
    document.getElementById('manutencao-status').textContent = ativa ? 'Ativado' : 'Desativado';
}

async function salvarConfiguracoes() {
    configuracoes.site = {
        nome: document.getElementById('config-nome').value,
        telefone: document.getElementById('config-telefone').value,
        email: document.getElementById('config-email').value,
        cor_primaria: document.getElementById('config-cor-primaria').value,
        cor_secundaria: document.getElementById('config-cor-secundaria').value,
        modo_manutencao: document.getElementById('modo-manutencao').checked,
        mensagem_manutencao: document.getElementById('mensagem-manutencao').value
    };
    
    const novaSenha = document.getElementById('config-senha').value;
    if (novaSenha) {
        configuracoes.admin = {
            ...configuracoes.admin,
            usuario: document.getElementById('config-usuario').value,
            senha: novaSenha
        };
    }
    
    const response = await apiPost('/configuracoes', configuracoes);
    if (response?.success) {
        await registrarLog('Configurações atualizadas');
        mostrarAlerta('Configurações salvas com sucesso!', 'success');
    }
}

// ========== LOGS ==========
function atualizarLogs() {
    const tbody = document.getElementById('tabela-logs');
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum log registrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.slice().reverse().map(log => `
        <tr>
            <td>${new Date(log.data).toLocaleString()}</td>
            <td>${log.usuario}</td>
            <td>${log.acao}</td>
            <td>${log.ip || '127.0.0.1'}</td>
        </tr>
    `).join('');
}

function filtrarLogs() {
    const filtro = document.getElementById('filtro-log').value;
    const tbody = document.getElementById('tabela-logs');
    
    let logsFiltrados = logs;
    
    if (filtro !== 'todos') {
        logsFiltrados = logs.filter(log => {
            if (filtro === 'login') return log.acao.includes('Login') || log.acao.includes('logout');
            if (filtro === 'produto') return log.acao.includes('Produto');
            if (filtro === 'config') return log.acao.includes('Config') || log.acao.includes('Promoção');
            return true;
        });
    }
    
    tbody.innerHTML = logsFiltrados.slice().reverse().map(log => `
        <tr>
            <td>${new Date(log.data).toLocaleString()}</td>
            <td>${log.usuario}</td>
            <td>${log.acao}</td>
            <td>${log.ip || '127.0.0.1'}</td>
        </tr>
    `).join('');
}

// ========== BACKUP ==========
function exportarBackup() {
    const backup = {
        data: new Date().toISOString(),
        produtos: produtos,
        configuracoes: configuracoes,
        logs: logs
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `backup-cheiro-tulipa-${Date.now()}.json`);
    link.click();
    
    registrarLog('Backup exportado');
    mostrarAlerta('Backup exportado com sucesso!', 'success');
}

// ========== ALERTAS ==========
function mostrarAlerta(mensagem, tipo = 'success') {
    const alerta = document.getElementById('alert-toast');
    const msgSpan = document.getElementById('alert-message');
    const icon = alerta.querySelector('i');
    
    msgSpan.textContent = mensagem;
    
    if (tipo === 'success') {
        icon.style.color = '#10b981';
        alerta.style.borderLeftColor = '#10b981';
        icon.className = 'fas fa-check-circle';
    } else if (tipo === 'error') {
        icon.style.color = '#ef4444';
        alerta.style.borderLeftColor = '#ef4444';
        icon.className = 'fas fa-exclamation-circle';
    }
    
    alerta.classList.add('show');
    
    setTimeout(() => {
        alerta.classList.remove('show');
    }, 3000);
}

// Fechar modais ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('modal-produto');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}