import pg from 'pg';
const { Client } = pg;
async function go() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cae_db' });
  await client.connect();
  const res = await client.query('SELECT count(*) FROM usuarios');
  console.log('Usuarios:', res.rows[0].count);
  process.exit(0);
}
go();
