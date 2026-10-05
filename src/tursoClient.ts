import https from 'node:https';

interface TursoValue {
  type: 'null' | 'integer' | 'float' | 'text' | 'blob';
  value?: string | number | null;
  base64?: string;
}

interface TursoResult {
  cols: Array<{ name: string; decltype?: string | null }>;
  rows: TursoValue[][];
  affected_row_count: number;
}

const DEFAULT_URL = 'libsql://blogersdb-nurillayevjamshid.aws-ap-southeast-2.turso.io';
const DEFAULT_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTEyMDAxNjIsImlkIjoiMDFhMTBiZDgtYTEwMS03NGM0LWFlZjQtYWRjYmMyMjg4YWFmIiwia2lkIjoiLU91UjFrWU00Z3BoVXpnbURfaG5ISkRjclk5Mm03UHZBOGRvTXJFYkY0ZyIsInJpZCI6IjIzMDg2MTE5LTZhOTgtNGQ0Yi1iNDI3LWQ5NTllMjA4ZWRkNiJ9.ac2RmCsSOJpL5NLzmL-jxD1KdxRk1h16dz9foYdZKp9Ke-kZUL0qZF2m_KaQGGpp9j8ckFZFblaUgToPE15TDQ';

export function getTursoConfig() {
  let dbUrl = process.env.TURSO_DATABASE_URL || DEFAULT_URL;
  const token = process.env.TURSO_AUTH_TOKEN || DEFAULT_TOKEN;

  dbUrl = dbUrl.trim();
  if (dbUrl.startsWith('libsql://')) {
    dbUrl = dbUrl.replace(/^libsql:\/\//, 'https://');
  } else if (!dbUrl.startsWith('https://') && !dbUrl.startsWith('http://')) {
    dbUrl = `https://${dbUrl}`;
  }

  // Turso pipeline HTTP endpoint
  const endpoint = new URL('/v2/pipeline', dbUrl).toString();
  return { endpoint, token };
}

function serializeParam(param: any): TursoValue {
  if (param === null || param === undefined) return { type: 'null' };
  if (typeof param === 'number') {
    return Number.isInteger(param)
      ? { type: 'integer', value: String(param) }
      : { type: 'float', value: param };
  }
  if (typeof param === 'boolean') {
    return { type: 'integer', value: param ? '1' : '0' };
  }
  return { type: 'text', value: String(param) };
}

function deserializeValue(val: TursoValue): any {
  if (!val || val.type === 'null') return null;
  if (val.type === 'integer') {
    const num = Number(val.value);
    return Number.isSafeInteger(num) ? num : val.value;
  }
  if (val.type === 'float') return Number(val.value);
  if (val.type === 'text') return val.value;
  if (val.type === 'blob') return val.base64 || val.value;
  return val.value;
}

export async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const { endpoint, token } = getTursoConfig();
  const args = params.map(serializeParam);

  const payload = JSON.stringify({
    requests: [
      {
        type: 'execute',
        stmt: {
          sql,
          args,
        },
      },
      { type: 'close' },
    ],
  });

  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`Turso HTTP Error ${res.statusCode}: ${rawData}`));
          }
          try {
            const parsed = JSON.parse(rawData);
            const firstResult = parsed.results?.[0];
            if (!firstResult) return resolve([]);
            if (firstResult.type === 'error') {
              return reject(new Error(`Turso SQL Error: ${firstResult.error?.message}`));
            }

            const responseResult: TursoResult = firstResult.response?.result;
            if (!responseResult || !responseResult.cols) return resolve([]);

            const cols = responseResult.cols.map((c) => c.name);
            const rows = (responseResult.rows || []).map((row) => {
              const obj: Record<string, any> = {};
              row.forEach((cell, idx) => {
                obj[cols[idx]] = deserializeValue(cell);
              });
              return obj;
            });

            resolve(rows);
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

export async function executeBatch(statements: Array<{ sql: string; params?: any[] }>): Promise<void> {
  const { endpoint, token } = getTursoConfig();

  const requests = statements.map((item) => ({
    type: 'execute',
    stmt: {
      sql: item.sql,
      args: (item.params || []).map(serializeParam),
    },
  }));
  requests.push({ type: 'close' } as any);

  const payload = JSON.stringify({ requests });

  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`Turso Batch HTTP Error ${res.statusCode}: ${rawData}`));
          }
          try {
            const parsed = JSON.parse(rawData);
            for (const r of parsed.results || []) {
              if (r.type === 'error') {
                return reject(new Error(`Turso Batch SQL Error: ${r.error?.message}`));
              }
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
