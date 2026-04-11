import json, os

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(os.path.join(DATA_DIR,'logs'), exist_ok=True)
RESET_DATA = os.getenv('RESET_DATA', 'false').lower() == 'true'

def seed(name, data):
    path = os.path.join(DATA_DIR, f'{name}.json')
    if RESET_DATA or not os.path.exists(path):
        with open(path,'w') as f: json.dump(data, f, ensure_ascii=False, indent=2)
        if RESET_DATA:
            print(f'↺ {name}.json restaurado')
        else:
            print(f'✓ {name}.json criado')
    else:
        print(f'  {name}.json já existe — pulado')

# Meses
seed('meses', [
    {'key':'2026-01','label':'Jan/2026'},
    {'key':'2026-02','label':'Fev/2026'},
    {'key':'2026-03','label':'Mar/2026'},
])

# Dados financeiros mensais (V, CMV, DEB_ML, ENC, EMP, DESP)
seed('financeiro', {
    'V': {
        'rp':  [10237.62, 94233.00, 104767.80],
        'ac':  [185.89, 2039.25, 2359.21],
        'txa': [-185.89, -2039.25, -2359.21],
        'tv':  [-2401.73, -21120.99, -13859.08],
        're':  [854.05, 5682.23, 5968.93],
        'te':  [-868.12, -6992.16, -18009.63],
        'ca':  [-580.39, -2840.38, -2656.68],
        'db':  [110.11, 738.07, 298.89],
        'lq':  [7351.54, 69699.77, 76510.23],
        'pd':  [183, 1556, 1737]
    },
    'CMV':     {'2026-01': 70511.21, '2026-02': 46909.99, '2026-03': 75010.14},
    'CMV_NF':  {'2026-01': 47354.29, '2026-02': 23640.00, '2026-03': 32541.92},
    'CMV_SN':  {'2026-01': 23156.92, '2026-02': 23269.99, '2026-03': 35700.22},
    'DEB_ML':  {'2026-01': -(1461.22+440.51+164.19), '2026-02': -(2655.18+2311.20+168.92), '2026-03': -(1902.22+153.43+4918.41+372.78)},
    'DEB_ML_DET': {
        '2026-01': {'recl':-1461.22,'retido':-440.51,'devolv':0,'envio':-164.19},
        '2026-02': {'recl':-2655.18,'retido':-2311.20,'devolv':0,'envio':-168.92},
        '2026-03': {'recl':-1902.22,'retido':-153.43,'devolv':-4918.41,'envio':-372.78},
    },
    'ENC': {'2026-01': 0, '2026-02': 2982.17, '2026-03': 7588.68},
    'EMP': {'2026-01': 0, '2026-02': 17602.42, '2026-03': 11202.05},
    'EMP_ENTRADA': {'2026-01': 13940.00, '2026-02': 0, '2026-03': 45569.00},
    'EMP_TOTAL':   {'2026-01': 17602.42, '2026-02': 17602.42, '2026-03': 69115.32},
    'APORTES':     {'2026-01': 83647.33, '2026-02': 60, '2026-03': 400.00},
    'DEV_APORTE':  {'2026-01': 14200.00, '2026-02': 8872.79, '2026-03': 0},
    'DESP': {
        '2026-01': {'contab':0,'pub':229.96,'imp':0,'tml':0,'prolabore_lucas':0,'prolabore_fellipe':0,'galpao':0,'frete':0},
        '2026-02': {'contab':370,'pub':7.99,'imp':4105.79,'tml':0,'prolabore_lucas':0,'prolabore_fellipe':0,'galpao':0,'frete':0},
        '2026-03': {'contab':0,'pub':57.89,'imp':4434.05,'tml':40.05,'prolabore_lucas':0,'prolabore_fellipe':8000,'galpao':567.10,'frete':795.00},
    },
    'E': {
        '2026-01': {'lib':7676.49,'dr':567.60,'em':179.20,'rb':1020.47,'ee':13940.00,'pc':83.14,'demp':0,'drc':-1461.22,'drt':-440.51,'ddv':0,'denv':-164.19,'dec':-16.82,'dft':0,'ddf':0,'pub':-229.96,'imp':0,'ban':0,'tml':0},
        '2026-02': {'lib':40803.40,'dr':1695.94,'em':419.18,'rb':960.30,'ee':0,'pc':0,'demp':-17602.42,'drc':-2655.18,'drt':-2311.20,'ddv':0,'denv':-168.92,'dec':0,'dft':-2982.17,'ddf':-25.82,'pub':-7.99,'imp':-4105.79,'ban':0,'tml':0},
        '2026-03': {'lib':51474.57,'dr':1928.53,'em':314.31,'rb':62933.72,'ee':45569.00,'pc':598.82,'demp':0,'drc':-1902.22,'drt':-1811.11,'ddv':-3107.30,'denv':-372.78,'dec':-153.43,'dft':-7588.68,'ddf':0,'pub':-57.89,'imp':-4434.05,'ban':0,'tml':-41.55},
    }
})

# Aportes individuais por sócio
seed('aportes', [
    {'id':1,'data':'09/01','socio':'Lucas Cristiano Pereira','descricao':'Kloos Distribuidora','obs':'Pgto via PF Lucas · fora do extrato ML','valor':21421.08,'tipo':'entrada','mes':'2026-01'},
    {'id':2,'data':'12/01','socio':'Lucas Cristiano Pereira','descricao':'LCP Serviços LTDA','obs':'Pix recebido · 141082891601','valor':18578.92,'tipo':'entrada','mes':'2026-01'},
    {'id':3,'data':'14/01','socio':'Lucas Cristiano Pereira','descricao':'Lucas Cristiano Pereira','obs':'Pix recebido · 141347230455','valor':6000.00,'tipo':'entrada','mes':'2026-01'},
    {'id':4,'data':'23/01','socio':'Lucas Cristiano Pereira','descricao':'Devolução de aporte','obs':'Saída para conta pessoal · Jan/2026','valor':14200.00,'tipo':'devolucao','mes':'2026-01'},
    {'id':5,'data':'12/01','socio':'Fellipe Genestra Delfino','descricao':'Fellipe Genestra Delfino','obs':'Pix recebido · 141084044527','valor':20000.00,'tipo':'entrada','mes':'2026-01'},
    {'id':6,'data':'15/01','socio':'Fellipe Genestra Delfino','descricao':'Fellipe Genestra Delfino','obs':'Pix recebido · 141464085997','valor':4800.00,'tipo':'entrada','mes':'2026-01'},
    {'id':7,'data':'15/01','socio':'Fellipe Genestra Delfino','descricao':'Fellipe Genestra Delfino','obs':'Pix recebido','valor':3974.54,'tipo':'entrada','mes':'2026-01'},
    {'id':8,'data':'29/01','socio':'Fellipe Genestra Delfino','descricao':'Rebeka Bustamante Fernandes Ribas','obs':'Pix recebido · 143957739352 — em nome de Fellipe','valor':8872.79,'tipo':'entrada','mes':'2026-01'},
    {'id':9,'data':'20/02','socio':'Fellipe Genestra Delfino','descricao':'Devolução de aporte','obs':'Pix enviado · 146336187381','valor':8872.79,'tipo':'devolucao','mes':'2026-02'},
    {'id':10,'data':'27/02','socio':'Fellipe Genestra Delfino','descricao':'Fellipe Genestra Delfino','obs':'Pix recebido · Fev/2026','valor':60.00,'tipo':'entrada','mes':'2026-02'},
    {'id':11,'data':'06/03','socio':'Fellipe Genestra Delfino','descricao':'Fellipe Genestra Delfino','obs':'Pix recebido · Mar/2026','valor':400.00,'tipo':'entrada','mes':'2026-03'},
])

# Empréstimos
seed('emprestimos', [
    {'id':1,'data':'23/01','descricao':'Dinheiro Express','obs':'143231930296','valor':13940.00,'tipo':'entrada','mes':'2026-01','total_pagar':17602.42},
    {'id':2,'data':'11/03','descricao':'Crédito por Porcentagem de Vendas','obs':'149923015772 · 20% de cada venda','valor':45569.00,'tipo':'entrada','mes':'2026-03','total_pagar':69115.32},
])

# Notas de compra
seed('notas', [
    {'id':1,'data':'2026-01-09','numero':'6318','fornecedor':'KLOOS DISTRIBUIDORA DE MATERIAIS LTDA','valor':21421.08,'valor_nf':0,'valor_sn':0,'tipo':'cmv','obs':'','particular':False},
    {'id':2,'data':'2026-01-16','numero':'23909','fornecedor':'MOHNISH IMPORTS LTDA','valor':14862.30,'valor_nf':7855.82,'valor_sn':7006.48,'tipo':'cmv','obs':'','particular':False},
    {'id':3,'data':'2026-01-16','numero':'11840','fornecedor':'P & D IMPEX IMPORTACAO E EXPORTACAO LTDA','valor':25941.62,'valor_nf':12970.81,'valor_sn':12970.81,'tipo':'cmv','obs':'','particular':False},
    {'id':4,'data':'2026-01-16','numero':'52010','fornecedor':'DYNASTY REAL UTILIDADES DOMESTICAS LTDA','valor':4146.00,'valor_nf':0,'valor_sn':0,'tipo':'cmv','obs':'','particular':False},
    {'id':5,'data':'2026-01-19','numero':'221579','fornecedor':'ZEIN IMPORTACAO E COMERCIO LTDA','valor':4026.21,'valor_nf':846.58,'valor_sn':3179.63,'tipo':'cmv','obs':'','particular':False},
    {'id':6,'data':'2026-01-25','numero':'36799','fornecedor':'EDM SHOP LTDA','valor':114.00,'valor_nf':0,'valor_sn':0,'tipo':'desp','obs':'','particular':False},
    {'id':7,'data':'2026-02-04','numero':'12003','fornecedor':'P & D IMPEX IMPORTACAO E EXPORTACAO LTDA','valor':17419.19,'valor_nf':8546.40,'valor_sn':8872.79,'tipo':'cmv','obs':'','particular':False},
    {'id':8,'data':'2026-02-11','numero':'12069','fornecedor':'P & D IMPEX IMPORTACAO E EXPORTACAO LTDA','valor':15961.20,'valor_nf':8143.80,'valor_sn':7817.40,'tipo':'cmv','obs':'','particular':False},
    {'id':9,'data':'2026-02-13','numero':'12112','fornecedor':'P & D IMPEX IMPORTACAO E EXPORTACAO LTDA','valor':7997.41,'valor_nf':0,'valor_sn':0,'tipo':'cmv','obs':'','particular':True},
    {'id':10,'data':'2026-02-26','numero':'52448','fornecedor':'DYNASTY REAL UTILIDADES DOMESTICAS LTDA','valor':5560.00,'valor_nf':2780.00,'valor_sn':2780.00,'tipo':'cmv','obs':'','particular':False},
    {'id':11,'data':'2026-02-26','numero':'12185','fornecedor':'P & D IMPEX IMPORTACAO E EXPORTACAO LTDA','valor':7599.60,'valor_nf':3799.80,'valor_sn':3799.80,'tipo':'cmv','obs':'','particular':False},
    {'id':12,'data':'2026-02-20','numero':'58','fornecedor':'ESCON - SERVICOS CONTABEIS LTDA','valor':370.00,'valor_nf':0,'valor_sn':0,'tipo':'desp','obs':'Contabilidade','particular':False},
    {'id':13,'data':'2026-03-06','numero':'395775','fornecedor':'LEONARDO COVO RODRIGUES COMERCIO LTDA','valor':116.38,'valor_nf':0,'valor_sn':0,'tipo':'cmv','obs':'','particular':False},
    {'id':14,'data':'2026-03-09','numero':'12240','fornecedor':'P & D IMPEX IMPORTACAO E EXPORTACAO LTDA','valor':17552.81,'valor_nf':8850.01,'valor_sn':8702.80,'tipo':'cmv','obs':'','particular':False},
    {'id':15,'data':'2026-03-13','numero':'12359','fornecedor':'P & D IMPEX IMPORTACAO E EXPORTACAO LTDA','valor':16250.48,'valor_nf':8125.49,'valor_sn':8124.99,'tipo':'cmv','obs':'','particular':False},
    {'id':16,'data':'2026-03-18','numero':'12411','fornecedor':'P & D IMPEX IMPORTACAO E EXPORTACAO LTDA','valor':6768.00,'valor_nf':0,'valor_sn':0,'tipo':'cmv','obs':'','particular':True},
    {'id':17,'data':'2026-03-18','numero':'52656','fornecedor':'DYNASTY REAL UTILIDADES DOMESTICAS LTDA','valor':3850.00,'valor_nf':1925.00,'valor_sn':1925.00,'tipo':'cmv','obs':'','particular':False},
    {'id':18,'data':'2026-03-19','numero':'225880','fornecedor':'ZEIN IMPORTACAO E COMERCIO LTDA','valor':5906.07,'valor_nf':1241.84,'valor_sn':4664.23,'tipo':'cmv','obs':'','particular':False},
    {'id':19,'data':'2026-03-25','numero':'12482','fornecedor':'P & D IMPEX IMPORTACAO E EXPORTACAO LTDA','valor':24566.40,'valor_nf':12283.20,'valor_sn':12283.20,'tipo':'cmv','obs':'','particular':False},
    {'id':20,'data':'2026-04-01','numero':'12534','fornecedor':'P & D IMPEX IMPORTACAO E EXPORTACAO LTDA','valor':13663.18,'valor_nf':6831.59,'valor_sn':6831.59,'tipo':'cmv','obs':'','particular':False},
    {'id':21,'data':'2026-04-01','numero':'52806','fornecedor':'DYNASTY REAL UTILIDADES DOMESTICAS LTDA','valor':5425.00,'valor_nf':2712.50,'valor_sn':2712.50,'tipo':'cmv','obs':'','particular':False},
    {'id':22,'data':'2026-04-01','numero':'1','fornecedor':'ATACADO APARECIDA "TELOS"','valor':5760.00,'valor_nf':0,'valor_sn':5760.00,'tipo':'cmv','obs':'','particular':False},
])

# SKUs ranking
seed('skus', [
    {'s':'Rock Crawler Off-Road','p':379,'u':390,'r':20741.96,'l':15530.08},
    {'s':'Carrinho Maluco 360','p':344,'u':372,'r':11671.90,'l':8403.21},
    {'s':'Estojo 208 Unicornio','p':128,'u':132,'r':7612.38,'l':5834.45},
    {'s':'Sunday 60 Fps 200ml','p':208,'u':372,'r':6688.30,'l':5320.00},
    {'s':'Carrinho Speed','p':197,'u':208,'r':6432.72,'l':4429.70},
    {'s':'Laptop Infantil Rosa','p':149,'u':156,'r':6222.24,'l':4574.11},
    {'s':'Carrinho Jipe Barbie Rosa','p':79,'u':81,'r':6093.35,'l':4286.21},
    {'s':'Laptop Infantil Azul','p':138,'u':143,'r':6081.90,'l':4473.05},
    {'s':'Carrinho Stunt 360','p':114,'u':121,'r':4968.20,'l':3723.28},
    {'s':'Piano Animal','p':142,'u':157,'r':4952.85,'l':3491.43},
    {'s':'Carrinho Gibizinho Pick-up','p':107,'u':110,'r':3949.90,'l':2987.75},
    {'s':'Helicoptero Super','p':67,'u':68,'r':3864.42,'l':2719.16},
    {'s':'Nutriex 30fps 120ml','p':80,'u':322,'r':3773.22,'l':2939.02},
    {'s':'Sunday 30 Fps 200ml','p':67,'u':270,'r':3569.30,'l':2788.14},
    {'s':'Big Foot 01','p':55,'u':56,'r':3224.80,'l':2229.04},
])

# Produtos com custos
seed('produtos', [
    {'id':1,'sku':'Rock Crawler Off-Road','custo':33.33,'estoque':66,'v30':270},
    {'id':2,'sku':'Carrinho Maluco 360','custo':21.50,'estoque':175,'v30':107},
    {'id':3,'sku':'Estojo 208 Unicornio','custo':45.50,'estoque':18,'v30':80},
    {'id':4,'sku':'Sunday 60 Fps 200ml','custo':16.19,'estoque':134,'v30':137},
    {'id':5,'sku':'Carrinho Speed','custo':19.58,'estoque':178,'v30':26},
    {'id':6,'sku':'Laptop Infantil Rosa','custo':25.35,'estoque':73,'v30':71},
    {'id':7,'sku':'Carrinho Jipe Barbie Rosa','custo':53.05,'estoque':74,'v30':36},
    {'id':8,'sku':'Laptop Infantil Azul','custo':25.35,'estoque':146,'v30':89},
    {'id':9,'sku':'Carrinho Stunt 360','custo':32.86,'estoque':105,'v30':46},
    {'id':10,'sku':'Piano Animal','custo':20.09,'estoque':70,'v30':45},
    {'id':11,'sku':'Carrinho Gibizinho Pick-up','custo':27.71,'estoque':14,'v30':49},
    {'id':12,'sku':'Helicoptero Super','custo':45.07,'estoque':1,'v30':0},
    {'id':13,'sku':'Nutriex 30fps 120ml','custo':7.29,'estoque':136,'v30':125},
    {'id':14,'sku':'Sunday 30 Fps 200ml','custo':9.79,'estoque':192,'v30':104},
    {'id':15,'sku':'Big Foot 01','custo':47.49,'estoque':0,'v30':33},
    {'id':16,'sku':'Lousa Magnetica 118pçs','custo':38.00,'estoque':106,'v30':4},
    {'id':17,'sku':'Dinossauro Pequeno','custo':24.03,'estoque':122,'v30':128},
    {'id':18,'sku':'Sunday 60 Fps 120ml','custo':9.29,'estoque':56,'v30':188},
    {'id':19,'sku':'Robo Aranha Rosa','custo':28.00,'estoque':34,'v30':64},
    {'id':20,'sku':'Carrinho Stunt 360 Verde','custo':32.86,'estoque':51,'v30':37},
])

# Logs vazio
seed('logs/historico', [])
print('\nPronto! Execute: python app.py')
