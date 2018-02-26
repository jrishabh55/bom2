class BomService {

  constructor() {
    this.bom = [];
  }

  add( bom ) {
    this.bom.push( bom );
  }

  clear() {
    this.bom = [];
  }

  all() {
    return this.bom;
  }

  addFromCsv(bom) {
    let title = "";
    if ( !Array.isArray( bom ) ) {
      return false;
    }
    if (bom[0].length === 1) {
      let title = bom[0][0];
      delete bom[0];
      bom = bom.filter(item => item);
    }
    // using the first array as keys from the CSV to create the object of the BOM,
    const keys = bom[0];
    delete bom[0];
    // filter is being used to reshift the array to proper indexes
    const data = {
      title: title,
      items: bom.filter( item => item ).map( items => items.reduce( ( obj, item, index ) => {
        obj[ keys[ index ] ] = item;
        return obj;
      }, {} ) )
    };
    this.add( data );
  }

  get( index ) {
    return this.bom[ index ];
  }

  last() {
    return this.bom.length > 0 ? this.bom.last()[0] : undefined;
  }

  get length() {
    return this.bom.length;
  }

  toJSON() {
    return JSON.stringify(this.all())
  }
}

const instance = new BomService();
export { instance as BomService };
