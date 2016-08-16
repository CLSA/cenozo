var fs = require( 'fs' );
try { fs.mkdirSync( './web/lib/' ); }
catch(e){}
try { fs.symlinkSync( './web/lib/', './node_modules', 'dir' ); }
catch(e){}
