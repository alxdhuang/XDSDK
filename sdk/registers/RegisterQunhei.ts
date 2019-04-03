import { XDSDK } from "../XDSDKManager";

declare const qhsdk;

export class QunheiAgent extends XDSDK.ChannelAgent {

    public static readonly GAMEID = "4187";

    public static openID: string;
    public static token: string;
    public static serverID: number;
    public static isadult: number;
    public static time: number;

    public init() {
        const params = XDSDK.SDKManager.getRequestParams();
        console.log(params);

        XDSDK.SDKManager.loadScript("https://port.2r3r.com/game/qhjssdk", () => {
            var initdata = { 
                "username":    params['username'],    //用户id，群黑登录接口里面username参数
                "gid":         QunheiAgent.GAMEID,    //群黑游戏id，可以在后台游戏列表查询
                "qhchannel":   params['qhchannel'],   //用户标识，群黑登录接口里面qhchannel参数
                "qhchannelid": params['qhchannelid'], //用户标识id，群黑登录接口里面qhchannelid参数
                "time":        params['time'],        //用户登录时间戳，群黑登录接口里面time参数
            };	
            qhsdk.init(initdata);

            QunheiAgent.openID = params['username'];
            QunheiAgent.serverID = params['serverid'];
            QunheiAgent.isadult = params['isadult'];
            QunheiAgent.time = params['time'];
            QunheiAgent.token = params['flag'];
        });
    }

    public loadAllPlugins() {
        XDSDK.SDKManager.getInstance().registerUserPlugin(new QunheiUserPlugin);
        XDSDK.SDKManager.getInstance().registerIAPPlugin(new QunheiIAPPlugin);
    }
}

export class QunheiUserPlugin extends XDSDK.UserPlugin {
    public login(callback?: (code: XDSDK.UserActionResultCode, msg: any) => void) {
        if (callback) {
            if (QunheiAgent.token) {
                callback(XDSDK.UserActionResultCode.kLoginSuccess, {
                    openID: QunheiAgent.openID,
                    token: QunheiAgent.token,
                    isAdult: QunheiAgent.isadult == 1,
                    time: QunheiAgent.time,
                });
            } else {
                callback(XDSDK.UserActionResultCode.kLoginFail, "");
            }
        }
    }

    public getUserID(): string {
        return QunheiAgent.openID;
    }

    public getUserInfo(callback?: (code: XDSDK.UserActionResultCode, msg: string|any) => void) {
        if (callback) {
            callback(XDSDK.UserActionResultCode.kGetUserInfoSuccess, "");
        }
    }

    public isLogined(): boolean {
        return QunheiAgent.token != null;
    }

    public logout(callback?: (code: XDSDK.UserActionResultCode, msg: string|any) => void) {
        if (callback) {
            callback(XDSDK.UserActionResultCode.kLogoutSuccess, "");
        }
    }

    public submitRoleInfo(info: XDSDK.RoleInfo) {
        const extra = info.extra.split('&');
        const extraData = {};
        for (const elem of extra) {
            const pair = elem.split('=');
            extraData[pair[0]] = pair[1];
        }

        var roledata = {
            "act":      info.dataType == 2 ? 1 : 2, // 1=创建角色，2=登录角色
            "serverid": info.zoneId,
            "rolename": info.roleName,
            "roleid":   info.roleId,
            "level":    info.roleLevel,
            "power":    extraData['power'] || 0,
        };
        qhsdk.role(roledata);
    }

    public sendToDesktop(url: string, callback?: (code: XDSDK.UserActionResultCode, msg: string|any) => void) {
        if (callback) {
            callback(XDSDK.UserActionResultCode.kSendToDesktopSuccess, '');
        }
    }
}

export class QunheiIAPPlugin extends XDSDK.IAPPlugin {

    public payForProduct(info: XDSDK.ProductInfo, callback?: (code: XDSDK.PayResultCode, msg: string) => void) {
        const extra = info.EXT.split('&');
        const extraData = {};
        for (const elem of extra) {
            const pair = elem.split('=');
            extraData[pair[0]] = pair[1];
        }

        var paydata = { 
            "userId":      QunheiAgent.openID,
            "gid":         QunheiAgent.GAMEID,
            "roleName":    info.Role_Name,
            'goodsId':     info.Product_Id,
            "goodsName":   info.Product_Name, 
            "money":       info.Product_Price,
            "ext":         info.CP_Order,
            "serverId":    info.Server_Id,
            "roleId":      info.Role_Id,
            "sign":        extraData['sign'],
        };	
        qhsdk.pay(paydata, (code, msg) => {
            //充值结果通知，code为编号，msg为信息。该结果不能作为发货依据。该回调已经取消！！请使用后端回调判断发货
            //code=1充值成功 ，其他为充值失败。
            //alert(code+','+msg);
            console.log(`${code} + ${msg}`);

            if (callback) {
                if (code == 1) {
                    callback(XDSDK.PayResultCode.kPaySuccess, msg);
                } else {
                    callback(XDSDK.PayResultCode.kPayFail, msg);
                }
            }
        });
    }

    public getOrderId(): string {
        return "";
    }
}