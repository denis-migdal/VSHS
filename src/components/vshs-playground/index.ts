import LISS from "@LISS/src/";
import PlaygroundArea from "@LISS/components/playground/playground-area/";
import buildTestPage from "@VSHS/utils/buildTestPage";
import initializeFakers from "@VSHS/utils/fakers/initializeFakers";

class VSHSPlayground extends PlaygroundArea {

    static override observedAttributes = [...PlaygroundArea.observedAttributes, "server"];

    override generateIFrameContext() {

        let ext = ".js";
        let block = this.codes['index.js'];
        if( this.codeLang === "bry" ) {
            ext = ".bry"
            block = this.codes['index.bry'];
        }
        const code  = block.getCode();
        const path = code.slice(3, code.indexOf('\n') - ext.length );

        return {
            initializeFakers: initializeFakers({
                code,
                codeLang: this.codeLang,
                server  : this.host.getAttribute('server'),
                path,
                request : this.codes["request.bry"].getCode()
            })
        }
    }

    override generateIFrameContent() {

        //TODO: move...
        const use_server = this.host.hasAttribute('server')
        const handler_code = this.codes[`index.${this.codeLang}`];
        handler_code.isRO  = use_server;

        if( use_server )
            handler_code.reset();

        return buildTestPage({
            codeLang: this.codeLang,
            js      : this.codes["request.js"  ].getCode(),
        });
    }

    protected static override ASSETS_DIR = `/assets/examples/`;
    
    protected static override RESSOURCES = [
        { file : 'index.js',    title: 'Request Handler (JS)'      },
        { file : 'index.bry',   title: 'Request Handler (Brython)' },
        { file : 'request.js',  title: 'Request (JS)'              },
        { file : 'request.bry', title: 'Request (Brython)'         },
    ]
}

LISS.define('vshs-playground', VSHSPlayground);