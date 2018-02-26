import history from './history';
import * as $ from 'jquery';

export { history as history };

export const env = ( $key, $default = "" ) => process.env[ $key ] || $default;

export const getProp = ( $obj, $key, $default = '-' ) => $obj
  ? $obj[ $key ] || $default
  : $default;

export const isLocal = Boolean( window.location.hostname === 'localhost' ||
// [::1] is the IPv6 localhost address.
window.location.hostname === '[::1]' ||
// 127.0.0.1/8 is considered localhost for IPv4.
window.location.hostname.match( /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/ ) );

export const toCSV = ( arr, header = [] ) => {
  const ser = serializeArray( arr );
  const result = ser.map( element => element.map( el => `"${ el.toString() }"` ).join( ',' ) );
  if ( header ) {
    result.unshift( header );
  }

  return result.join( '\n' );
}

export const serializeArray = ( arr ) => {
  if ( !Array.isArray( arr ) ) {
    arr = JSON.parse( arr );
  }
  const result = [];
  result.push( Object.keys( arr[ 0 ] ) );
  arr.forEach( row => {
    result.push( Object.values( row ) );
  } );

  return result;

}

export const download = ( filename, data ) => {
  const blob = new Blob( [data], { type: 'text/csv' } );
  if ( window.navigator.msSaveOrOpenBlob ) {
    window.navigator.msSaveBlob( blob, filename );
  } else {
    const elem = window.document.createElement( 'a' );
    elem.href = window.URL.createObjectURL( blob );
    elem.download = filename;
    document.body.appendChild( elem );
    elem.click();
    document.body.removeChild( elem );
  }
}

export const parseCsv = function ( data ) {
  if ( typeof data !== 'string' ) {
    return false;
  }

  return data.split( '\n' ).map( item => item.split( ',' ) );
}

export const parseCsvFile = async ( file ) => {
  return new Promise( ( resolve, reject ) => {
    const reader = new FileReader();
    reader.readAsText( file );
    reader.onload = function ( event ) {
      const csv = event.target.result;
      const data = $.csv.toArrays( csv );
      resolve( data );
    }

    reader.onerror = function () {
      reject( 'Unable to read ' + file.fileName );
    };
  } );
}
