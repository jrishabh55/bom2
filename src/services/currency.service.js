class currencyService {
    constructor() {
    }
    currencyData() {
        return fetch('https://api.fixer.io/latest?base=INR&symbols=USD,GBP').then(res => res.json())
    }
}

const instance = new currencyService();
export { instance as currencyService };
