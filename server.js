const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração de upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'produto-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas (JPEG, PNG, GIF, WEBP)'));
        }
    }
});

// ========== ROTAS DA API ==========

// GET - Listar todos os produtos
app.get('/api/produtos', (req, res) => {
    try {
        if (!fs.existsSync('produtos.json')) {
            fs.writeFileSync('produtos.json', JSON.stringify({ produtos: [] }));
        }
        const data = JSON.parse(fs.readFileSync('produtos.json', 'utf8'));
        res.json(data);
    } catch (error) {
        console.error('Erro ao ler produtos:', error);
        res.status(500).json({ error: 'Erro ao carregar produtos' });
    }
});

// GET - Produto por ID
app.get('/api/produtos/:id', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('produtos.json', 'utf8'));
        const produto = data.produtos.find(p => p.id === parseInt(req.params.id));
        if (produto) {
            res.json(produto);
        } else {
            res.status(404).json({ error: 'Produto não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar produto' });
    }
});

// POST - Criar novo produto
app.post('/api/produtos', upload.single('imagem'), (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('produtos.json', 'utf8'));
        
        const novoProduto = {
            id: data.produtos.length > 0 ? Math.max(...data.produtos.map(p => p.id)) + 1 : 1,
            nome: req.body.nome,
            descricao: req.body.descricao,
            preco_original: parseFloat(req.body.preco_original),
            preco_promocional: req.body.em_promocao === 'true' ? parseFloat(req.body.preco_promocional) : 0,
            em_promocao: req.body.em_promocao === 'true',
            categoria: req.body.categoria,
            destaque: req.body.destaque === 'true',
            estoque: parseInt(req.body.estoque) || 0,
            imagem: req.file ? req.file.filename : 'placeholder.jpg',
            data_criacao: new Date().toISOString().split('T')[0]
        };
        
        data.produtos.push(novoProduto);
        fs.writeFileSync('produtos.json', JSON.stringify(data, null, 2));
        
        res.json({ success: true, produto: novoProduto });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
});

// PUT - Atualizar produto
app.put('/api/produtos/:id', upload.single('imagem'), (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('produtos.json', 'utf8'));
        const index = data.produtos.findIndex(p => p.id === parseInt(req.params.id));
        
        if (index === -1) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        
        const produtoAtualizado = {
            ...data.produtos[index],
            nome: req.body.nome,
            descricao: req.body.descricao,
            preco_original: parseFloat(req.body.preco_original),
            preco_promocional: req.body.em_promocao === 'true' ? parseFloat(req.body.preco_promocional) : 0,
            em_promocao: req.body.em_promocao === 'true',
            categoria: req.body.categoria,
            destaque: req.body.destaque === 'true',
            estoque: parseInt(req.body.estoque) || 0,
            imagem: req.file ? req.file.filename : data.produtos[index].imagem
        };
        
        data.produtos[index] = produtoAtualizado;
        fs.writeFileSync('produtos.json', JSON.stringify(data, null, 2));
        
        res.json({ success: true, produto: produtoAtualizado });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

// DELETE - Remover produto
app.delete('/api/produtos/:id', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('produtos.json', 'utf8'));
        const produtoRemovido = data.produtos.find(p => p.id === parseInt(req.params.id));
        
        data.produtos = data.produtos.filter(p => p.id !== parseInt(req.params.id));
        fs.writeFileSync('produtos.json', JSON.stringify(data, null, 2));
        
        // Remover imagem se não for placeholder
        if (produtoRemovido && produtoRemovido.imagem && produtoRemovido.imagem !== 'placeholder.jpg') {
            const imagemPath = path.join(__dirname, 'uploads', produtoRemovido.imagem);
            if (fs.existsSync(imagemPath)) {
                fs.unlinkSync(imagemPath);
            }
        }
        
        res.json({ success: true, message: 'Produto removido' });
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        res.status(500).json({ error: 'Erro ao deletar produto' });
    }
});

// GET - Configurações
app.get('/api/configuracoes', (req, res) => {
    try {
        if (!fs.existsSync('configuracoes.json')) {
            const configPadrao = {
                site: {
                    nome: "Cheiro de Tulipa",
                    telefone: "5511999999999",
                    email: "contato@cheirodetulipa.com",
                    cor_primaria: "#6d28d9",
                    cor_secundaria: "#8b5cf6",
                    modo_manutencao: false,
                    mensagem_manutencao: "Site em manutenção. Voltamos em breve!"
                },
                admin: {
                    usuario: "admin",
                    senha: "tulipa@2026"
                },
                promocoes_24h: {
                    ativa: false,
                    desconto_global: 15,
                    mensagem: "🔥 Promoção relâmpago: 15% OFF em todos os produtos!",
                    icone: "fa-bolt"
                }
            };
            fs.writeFileSync('configuracoes.json', JSON.stringify(configPadrao, null, 2));
        }
        const data = JSON.parse(fs.readFileSync('configuracoes.json', 'utf8'));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar configurações' });
    }
});

// POST - Salvar configurações
app.post('/api/configuracoes', (req, res) => {
    try {
        fs.writeFileSync('configuracoes.json', JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
});

// GET - Logs
app.get('/api/logs', (req, res) => {
    try {
        if (!fs.existsSync('logs.json')) {
            fs.writeFileSync('logs.json', JSON.stringify({ logs: [] }));
        }
        const data = JSON.parse(fs.readFileSync('logs.json', 'utf8'));
        res.json(data);
    } catch (error) {
        res.json({ logs: [] });
    }
});

// POST - Adicionar log
app.post('/api/logs', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('logs.json', 'utf8'));
        const novoLog = {
            id: data.logs.length + 1,
            data: new Date().toISOString(),
            ...req.body
        };
        data.logs.push(novoLog);
        fs.writeFileSync('logs.json', JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar log' });
    }
});

// POST - Upload de imagem
app.post('/api/upload', upload.single('imagem'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhuma imagem enviada' });
        }
        res.json({
            success: true,
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Estatísticas
app.get('/api/estatisticas', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('produtos.json', 'utf8'));
        const produtos = data.produtos || [];
        
        const stats = {
            total: produtos.length,
            promocoes: produtos.filter(p => p.em_promocao).length,
            destaques: produtos.filter(p => p.destaque).length,
            estoque: produtos.reduce((acc, p) => acc + (p.estoque || 0), 0),
            categorias: {
                velas: produtos.filter(p => p.categoria === 'velas').length,
                sabonetes: produtos.filter(p => p.categoria === 'sabonetes').length,
                'sabonetes-liquidos': produtos.filter(p => p.categoria === 'sabonetes-liquidos').length,
                kits: produtos.filter(p => p.categoria === 'kits').length
            }
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao calcular estatísticas' });
    }
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║    CHEIRO DE TULIPA - SERVIDOR        ║
    ╠═══════════════════════════════════════╣
    ║  🚀 Porta: ${PORT}                       ║
    ║  🌐 Site: http://localhost:${PORT}       ║
    ║  🔧 Admin: http://localhost:${PORT}/admin.html ║
    ║  📦 API: http://localhost:${PORT}/api    ║
    ╚═══════════════════════════════════════╝
    `);
    
    // Criar pastas necessárias
    const pastas = ['uploads', 'data'];
    pastas.forEach(pasta => {
        if (!fs.existsSync(pasta)) {
            fs.mkdirSync(pasta);
            console.log(`📁 Pasta criada: ${pasta}`);
        }
    });
});