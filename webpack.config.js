const WF = require("./build/WebpackFramework");

module.exports = WF.buildConfigs("./src/",
                                 "./dist/${version}/",
                                {
                                    "@LISS": "libs/LISS/V3/",
                                    "@VSHS": "src/"
                                });