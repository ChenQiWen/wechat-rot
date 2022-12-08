import { WechatyBuilder, ScanStatus, log } from "wechaty";
import qrTerminal from "qrcode-terminal";
import { getChatGPTReply } from "./chatgpt.js";

// 扫码
function onScan(qrcode, status) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    // 在控制台显示二维码
    qrTerminal.generate(qrcode, { small: true });
    const qrcodeImageUrl = [
      "https://api.qrserver.com/v1/create-qr-code/?data=",
      encodeURIComponent(qrcode),
    ].join("");
    console.log("onScan:", qrcodeImageUrl, ScanStatus[status], status);
  } else {
    log.info("onScan: %s(%s)", ScanStatus[status], status);
  }
}

// 登录
function onLogin(user) {
  console.log(`${user} 上线了`);
  const date = new Date();
  console.log(`当前时间:${date}`);
  console.log(`自动聊天机器人已启动 将自动回复消息`);
}

// 登出
function onLogout(user) {
  console.log(`${user} 退出登录`);
}

// 收到好友请求
async function onFriendShip(friendship) {
  const frienddShipRe = /chatgpt|chat/;
  if (friendship.type() === 2) {
    if (frienddShipRe.test(friendship.hello())) {
      await friendship.accept();
    }
  }
}

// 收到消息
async function onMessage(msg) {
  const contact = msg.talker(); // 发消息人
  const receiver = msg.to(); // 消息接收人
  const content = msg.text(); // 消息内容
  const room = msg.room(); // 是否是群消息
  const alias = (await contact.alias()) || (await contact.name()); // 发消息人昵称
  const isText = msg.type() === bot.Message.Type.Text; // 消息类型是否为文本
  // TODO 你们可以根据自己的需求修改这里的逻辑，测试记得加限制，我这边消息太多了，这里只处理指定的人的消息
  // if (alias === "Seven Eleven" && isText) {
    console.log("🚀🚀🚀 / 收到的消息", `${alias}:${content}`);
    const reply = await getChatGPTReply(content);
    console.log("🚀🚀🚀 / 发送的消息", reply);
    try {
      await contact.say('[AI自动回复]: '+reply);
    } catch (e) {
      console.error(e);
    // }
    return;
  }
}

// 初始化机器人
const bot = WechatyBuilder.build({
  name: "WechatEveryDay",
  puppet: "wechaty-puppet-wechat", // 如果有token，记得更换对应的puppet
  puppetOptions: {
    uos: true,
  },
});

// 扫码
bot.on("scan", onScan);
// 登录
bot.on("login", onLogin);
// 登出
bot.on("logout", onLogout);
// 收到消息
bot.on("message", onMessage);
// 添加好友
bot.on("friendship", onFriendShip);

// 启动微信机器人
bot
  .start()
  .then(() => console.log("登录微信中。。。"))
  .catch((e) => console.error(e));
