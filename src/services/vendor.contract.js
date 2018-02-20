class VendorContract {

    constructor() {
        this.customerId;
    }

    getCustomerId() {
        console.log(this.customerId)
        return this.customerId;
    }

    setCustomerId($id) {
        this.customerId = $id;
        console.log(this.customerId)
    }
}

const instance = new VendorContract();
export { instance as VendorContract };
