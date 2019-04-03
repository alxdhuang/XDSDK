import { XDSDK } from "../XDSDKManager";

declare const QuickSDK;

export class QuickAgent extends XDSDK.ChannelAgent {

    public static readonly PRODUCT_CODE = "89197742775323345702293892639718";
    public static readonly PRODUCT_KEY = "62749267";
    public static readonly IS_DEBUG = true;

    public static token: string;
    public static openID: string;
    public static channelID: number;

    public init() {
        const params = XDSDK.SDKManager.getRequestParams();
        console.log(params);

        XDSDK.SDKManager.loadScript("https://sdkapi02.quicksdk.net/static/lib/libQuickSDK.js", () => {
            if (params['token']) { // 先保存token，之后用以自动登录
                QuickAgent.token = params['token'];
            }

            QuickSDK.getUserInfo((d) => {
                if (d['status']) {
                    QuickAgent.openID = d['data']['uid'];
                    QuickAgent.channelID = d['data']['channelId'];

                    QuickSDK.init(
                        QuickAgent.PRODUCT_CODE, 
                        QuickAgent.PRODUCT_KEY, 
                        QuickAgent.IS_DEBUG, 
                        QuickAgent.channelID
                    );
                }
            });
        });
    }

    public loadAllPlugins() {
        XDSDK.SDKManager.getInstance().registerUserPlugin(new QuickUserPlugin);
        XDSDK.SDKManager.getInstance().registerIAPPlugin(new QuickIAPPlugin);
    }
}

export class QuickUserPlugin extends XDSDK.UserPlugin {

    public login(callback?: (code: XDSDK.UserActionResultCode, msg: any) => void) {
        const success = () => {
            if (callback) {
                callback(XDSDK.UserActionResultCode.kLoginSuccess, {
                    openID: QuickAgent.openID,
                    token: QuickAgent.token
                });
            }
        };

        if (QuickAgent.token) {
            success();
        } else {
            QuickSDK.login((d) => {
                console.log(d);
                if (d.status) {
                    const data = d['data'];
                    QuickAgent.openID = data['uid'];
                    QuickAgent.token = data['token'];
    
                    success();
                } else {
                    console.log(`QuickSDK login failed! ${d.message}`);

                    if (callback) {
                        callback(XDSDK.UserActionResultCode.kLoginFail, d.message);
                    }
                }
            });
        }
    }

    public getUserID(): string {
        return QuickAgent.openID;
    }

    public getUserInfo(callback?: (code: XDSDK.UserActionResultCode, msg: string|any) => void) {
        if (callback) {
            callback(XDSDK.UserActionResultCode.kGetUserInfoSuccess, {});
        }
    }

    public isLogined(): boolean {
        return QuickAgent.token != null && QuickAgent.token != "";
    }

    public logout(callback?: (code: XDSDK.UserActionResultCode, msg: string|any) => void) {
        QuickSDK.logout((logoutObject) => {
            if (callback) {
                callback(XDSDK.UserActionResultCode.kLogoutSuccess, "");
            }
        });
    }

    public submitRoleInfo(info: XDSDK.RoleInfo) {
        const roleInfo = {
            isCreateRole:    info.dataType == 2,  
            roleCreateTime:  info.roleCTime,        
            uid:             QuickAgent.openID,         
            serverId:        info.zoneId,      
            serverName:      info.zoneName,   
            userRoleName:    info.roleName,
            userRoleId:      info.roleId,
            userRoleBalance: info.balance,
            vipLevel:        info.vipLevel,
            userRoleLevel:   info.roleLevel,
            partyId:         info.partyName,
            partyName:       info.partyName,
            gameRoleGender:  '',
            gameRolePower:   0,
            partyRoleId:     0,
            partyRoleName:   '',
            professionId:    '',
            profession:      '',
            friendlist:      '',
        };

        const roleInfoJson = JSON.stringify(roleInfo);
        QuickSDK.uploadGameRoleInfo(roleInfoJson, (response) => {
            console.log(response);
        });
    }

    public sendToDesktop(url: string, callback?: (code: XDSDK.UserActionResultCode, msg: string|any) => void) {
        if (callback) {
            callback(XDSDK.UserActionResultCode.kSendToDesktopSuccess, "");
        }
    }
}

export class QuickIAPPlugin extends XDSDK.IAPPlugin {
    public payForProduct(info: XDSDK.ProductInfo, callback?: (code: XDSDK.PayResultCode, msg: string) => void) {
        const orderInfo = {
            productCode:     QuickAgent.PRODUCT_CODE,
            uid:             QuickAgent.openID,
            username:        '',
            userRoleId:      info.Role_Id,
            userRoleName:    info.Role_Name,
            serverId:        info.Server_Id,
            userServer:      info.Server_Name,
            userLevel:       info.Role_Grade, 
            cpOrderNo:       info.CP_Order,
            amount:          info.Product_Price,
            subject:         info.Product_Name,
            desc:            info.Product_Desc,
            callbackUrl:     "",
            extrasParams:    '',
            goodsId:         info.Product_Id,
            count:           info.Product_Count,
            quantifier:      "个",
        };   
        
        var orderInfoJson = JSON.stringify(orderInfo);
        
        QuickSDK.pay(orderInfoJson, (payStatusObject) => {
            if (payStatusObject.status) {
                if (callback) {
                    callback(XDSDK.PayResultCode.kPaySuccess, "");
                }
            } else {
                if (callback) {
                    callback(XDSDK.PayResultCode.kPayFail, "");
                }
            }    
        });
    }
}
