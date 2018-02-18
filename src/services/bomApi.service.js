export const contract = {
  host: "https://scalr.api.appbase.io",
  port: 443,
  prefix: ""
};

class BomApiService {

  constructor () {

    this.key = 'dkpTM3VsQmRKOmNmNjA3MmJhLTM3MWQtNDFkOC04Njg0LTU1NGY1ZmJjZTU3ZQ==';

    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + this.key
    };

  }

  async get(url, query) {
    return fetch(this.buildUrl(url, query), { headers: this.headers}).then(this.parse);
  }

  async post(url, body) {
    return fetch(this.buildUrl(url), {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body)
    }).then(this.parse);
  }

  async delete(url, query) {
    return fetch(this.buildUrl(url, query), { method: 'DELETE', headers: this.headers }).then(this.parse);
  }

  buildUrl(url, $query) {
    let query = [];

    if (query && typeof $query === 'object') {
      for (let key in $query) {
        query.push(`${key}=${$query[key]}`);
      }
    }

    return `${contract.host}:${contract.port}${contract.prefix}${url}?${query.join('&')}`;
  }

  parse(res) {
    return res.json();
  }
}

const instance = new BomApiService();
export { instance as BomApiService }
