export namespace XDSDK {

export enum ChannelID {
    NONE,
    QUICK,
    QUNHEI,
}

export enum UserActionResultCode {
    kLoginSuccess,
    kLoginFail,
    kLoginCancel,
    kLoginNetWorkError,
    kGetUserInfoSuccess,
    kGetUserInfoFail,
    kLogoutSuccess,
    kLogoutFail,
    kSendToDesktopSuccess,
    kSendToDesktopFail,
}

export enum PayResultCode {
    kPaySuccess,
    kPayFail,
    kPayCancel,
    kPayNetWorkError,
    kPayProductionInforIncomplete,
}

export interface RoleInfo {
    dataType: number;       // 数据类型，1 为进入游戏，2 为创建角色，3 为角色升级，4 为退出
    roleId: string;         // 角色 ID
    roleName: string;	    // 角色名称
    roleLevel: number;	    // 角色等级
    zoneId: string;         // 服务器 ID
    zoneName: string;       // 服务器名称
    balance: number;        // 用户余额（RMB 购买的游戏币）
    partyName: string;	    // 帮派、公会等
    vipLevel: number;       // VIP 等级
    roleCTime: number;      // 角色创建时间（单位：秒）（历史角色没记录时间的传 -1，新创建的角色必须要）
    roleLevelMTime: number; // 角色等级变化时间（单位：秒）（创建角色和进入游戏时传 -1）
    extra: string;          // 扩展数据
}

export interface ProductInfo {
    Product_Id: string;     // 商品 ID（联想、七匣子、酷派等商品 ID 要与在渠道后台配置的商品 ID 一致）
    Product_Name: string;	// 商品名
    Product_Price: number;	// 商品价格（元），可能有的 SDK 只支持整数
    Product_Count: number;	// 商品份数（除非游戏需要支持一次购买多份商品，否则传 1 即可）
    Product_Desc: string;   // 商品描述（不传则使用 Product_Name）
    Coin_Name: string;      // 虚拟币名称（如金币、元宝）
    Coin_Rate: number;	    // 虚拟币兑换比例（例如 100，表示 1 元购买 100 虚拟币）
    Role_Id: string;        // 游戏角色 ID
    Role_Name: string;      // 游戏角色名
    Role_Grade: number;	    // 游戏角色等级
    Role_Balance: number;	// 用户游戏内虚拟币余额，如元宝，金币，符石
    Vip_Level: number;	    // VIP 等级
    Party_Name:	string;     // 帮派、公会等
    Server_Id: string;	    // 服务器 ID，若无填 "1"
    Server_Name: string;    // 服务器名
    CP_Order: string;       // 商户订单号
    EXT: string;            // 扩展字段
}

export class ChannelAgent {
    /**
     * Override this
     */
    public init() {

    }

    /**
     * Override this
     */
    public loadAllPlugins() {
        SDKManager.getInstance().registerUserPlugin(new UserPlugin);
        SDKManager.getInstance().registerIAPPlugin(new IAPPlugin);
    }
}

export class UserPlugin {

    /**
     * Override this
     * @param serverID 
     */
    public login(callback?: (code: UserActionResultCode, msg: any) => void) {
        
    }

    /**
     * Override this
     */
    public getUserID(): string {
        return "";
    }

    /**
     * Override this
     */
    public getUserInfo(callback?: (code: UserActionResultCode, msg: string|any) => void) {
        
    }

    /**
     * Override this
     */
    public isLogined(): boolean {
        return false;
    }

    /**
     * Override this
     */
    public logout(callback?: (code: UserActionResultCode, msg: string|any) => void) {

    }

    /**
     * Override this
     * @param info 
     */
    public submitRoleInfo(info: RoleInfo) {

    }

    /**
     * Override this
     * @param url 
     */
    public sendToDesktop(url: string, callback?: (code: UserActionResultCode, msg: string|any) => void) {

    }
}

export class IAPPlugin {

    /**
     * Override this
     */
    public payForProduct(info: ProductInfo, callback?: (code: PayResultCode, msg: string) => void) {

    }

    /**
     * Override this
     */
    public getOrderId(): string {
        return "";
    }
}

export class SDKManager {
    private userPlugin: UserPlugin;
    private iapPlugin: IAPPlugin;

    private currentChannelID: ChannelID = ChannelID.NONE;

    private agent: ChannelAgent;

    private static instance: SDKManager;

    public static getInstance(): SDKManager {
        if (!this.instance) {
            this.instance = new SDKManager();
        }
        return this.instance;
    }

    private constructor() {
        
    }

    public static loadScript(url: string, onLoad?: Function) {
        var scrs = document.getElementsByTagName('script');
        var last = scrs[scrs.length - 1];
        var scr = document.createElement('script');
        last.parentNode.insertBefore(scr, last);

        scr.src = url;
        scr.async = true;
        scr.onload = () => {
            onLoad && onLoad();
        };
    }

    public static getRequestParams(): Object {
        const url = location.search; // 获取 url 中"?"符后的字串 
        const params = {}; 
        if (url.indexOf("?") != -1) {
            const strs = url.substr(1).split("&"); 
            for (const str of strs) {
                const field = str.split('=');
                params[field[0]] = unescape(field[1]); 
            } 
        } 
        return params;
    }

    public setChannel(id: ChannelID) {
        this.currentChannelID = id;
    }

    public init() {
        switch (this.currentChannelID) {
            case ChannelID.QUICK: 
                {
                    const m = require('./registers/RegisterQuick');
                    this.agent = new m.QuickAgent();    
                }   
                break;
            case ChannelID.QUNHEI:
                {
                    const m = require('./registers/RegisterQunhei');
                    this.agent = new m.QunheiAgent();    
                }   
                break;
            default:
                console.log(`WARNING: no channel`);
                this.agent = new ChannelAgent();
                break;
        }

        this.agent.init();
    }

    public loadAllPlugins() {
        this.agent.loadAllPlugins();
    }

    public getUserPlugin(): UserPlugin {
        return this.userPlugin;
    }

    public getIAPPlugin(): IAPPlugin {
        return this.iapPlugin;
    }

    /**
     * Registers
     **/

    public registerUserPlugin(plugin: UserPlugin) {
        this.userPlugin = plugin;
    }

    public registerIAPPlugin(plugin: IAPPlugin) {
        this.iapPlugin = plugin;
    }
}

} // end of namespace