const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const URL = ".......";

async function main() {
    let fetchResponse = await fetch(URL);
    let responseText = await fetchResponse.text();

    let toml = new TOML(responseText);
    console.log(toml.json);
}


/**
 * @private 
 */
class TOML {

    /**
     * @param {string} text 
     */
    constructor(text) {
        /** @private */
        this.lines = text.split("\n");
    }


    /**
     * @private
     * delete comment and empty line
     */
    deleteComment() {
        this.lines = this.lines.filter((line) => line.split(":::", 1)[0]);
    }

    /**
     * @private
     * delete rect braces
     */
    parseRectBraces() {
        let rectBracesPattern = /^\[(.*)\]$/;

        this.iterate((line) => {
            let searched = rectBracesPattern.exec(line);

            if(!searched) return line;
            return searched[1];
        });

    }

    /**
     * @private
     * parse kv to key value array
     */
    parseKV() {
        let kvPattern = /^([A-Za-z0-9]{1,})\s*=\s*(.*)$/;
        this.iterate((line) => {
            let searched = kvPattern.exec(line);
            
            if(!searched) return line;
            return [ searched[1], searched[2] ];
        });
    }

    /**
     * @private
     * change case all key to lower only for first character
     */
    toLowerKey() {
        this.iterate((line) => {
            if(Array.isArray(line)) {
                line[0] = this.toLower(line[0]);
            } else {
                line = this.toLower(line);
            }

            return line;
        });
    }

    /**
     * @private
     * @param {string} str 
     * @returns {string}
     */
     toLower(str) {
        let firstLower = str[0].toLowerCase();
        let secondLower = str[1].toLowerCase();

        if(str[0] != firstLower && str[1] != secondLower) {
            return str.toLowerCase();
        }
        return str[0].toLowerCase() + str.slice(1);
    }

    /**
     * @private
     * @param {(line: (string | string[])) => (string | string[])} callback 
     */
    buildJSON() {
        let object = {};

        let lastKey = null;
        this.iterate((line) => {

            if(!Array.isArray(line)) {
                lastKey = line;
                return;
            }

            if(!lastKey) {
                object[line[0]] = line[1];
                return;
            }

            if(!object[lastKey]) object[lastKey] = {};

            object[lastKey][line[0]] = line[1];
        });

        return object;
    }

    /**
     * @private
     * @param {(line: (string | string[])) => (string | string[])} callback 
     */
    iterate(callback) {
        this.lines = this.lines.map(callback);
    }

    get json() {

        this.deleteComment();
        this.parseRectBraces();
        this.parseKV();
        this.toLowerKey();
        return this.buildJSON();
    }


}

main();