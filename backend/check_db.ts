import pool from './src/db/index.js';
async function run() {
  try {
    const resE = await pool.query('SELECT * FROM empreendedores LIMIT 5');
    console.log('EMPREENDEDORES:', JSON.stringify(resE.rows, null, 2));
    const resA = await pool.query('SELECT * FROM atendimentos LIMIT 5');
    console.log('ATENDIMENTOS:', JSON.stringify(resA.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
