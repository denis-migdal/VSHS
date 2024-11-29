import { getState, initialize, initializeSync, upgrade, upgradeSync, whenInitialized, whenUpgraded } from "../state";
import LISS from "../extends";
LISS.DEFINED = LISS.DEFINED,
    LISS.READY = LISS.READY;
LISS.UPGRADED = LISS.UPGRADED;
LISS.INITIALIZED = LISS.INITIALIZED;
LISS.getState = getState;
LISS.upgrade = upgrade;
LISS.initialize = initialize;
LISS.upgradeSync = upgradeSync;
LISS.initializeSync = initializeSync;
LISS.whenUpgraded = whenUpgraded;
LISS.whenInitialized = whenInitialized;
//# sourceMappingURL=state.js.map