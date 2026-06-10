const { MercadoPagoConfig, Preference } = require('mercadopago');
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN });
const pref = new Preference(client);
pref.create({
  body: {
    items: [{ id: 'test', title: 'Teste', quantity: 1, currency_id: 'BRL', unit_price: 10 }],
    payment_methods: { excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }] },
    back_urls: { success: 'http://localhost:3000/success', failure: 'http://localhost:3000/failure', pending: 'http://localhost:3000/pending' },
    auto_return: 'approved',
    external_reference: 'test123',
  }
}).then(r => console.log('OK', r.init_point)).catch(e => {
  console.error('STATUS:', e.status);
  console.error('MESSAGE:', e.message);
  console.error('CAUSE:', JSON.stringify(e.cause));
})
