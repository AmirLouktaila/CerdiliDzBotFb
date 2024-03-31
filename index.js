const express = require("express");
const app = express();
const Botly = require("botly");
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SB_URL, process.env.SB_KEY, { auth: { persistSession: false } });
const botly = new Botly({
  accessToken: process.env.PAGE_ACCESS_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  notificationType: Botly.CONST.REGULAR,
  FB_URL: "https://graph.facebook.com/v2.6/",
});

/* ----- DB Qrs ----- */
async function createUser(user) {
  const { data, error } = await supabase
    .from('users')
    .insert([user]);

  if (error) {
    throw new Error('Error creating user : ', error);
  } else {
    return data
  }
};

async function updateUser(id, update) {
  const { data, error } = await supabase
    .from('users')
    .update(update)
    .eq('id', id);

  if (error) {
    throw new Error('Error updating user : ', error);
  } else {
    return data
  }
};

async function userDb(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId);

  if (error) {
    console.error('Error checking user:', error);
  } else {
    return data
  }
};

/*-----------end-----------*/

/* ----- fun api algeria telecome ----- */
async function responseData(chatMe) {

  const parts = chatMe.split(":");

  const number = parts[0];
  const password = parts[1];

  const data = {
    "nd": number,
    "password": password
  };
  console.log(data)
  try {
    // Make the POST request
    const response = await axios.post('https://mobile-pre.at.dz/api/auth/login', data);

    // Check if the request was successful
    if (response.status === 200) {
      console.log("res : ", response.data);
      const json_data = response.data;
      const fname = json_data.data.original.nom;
      const lname = json_data.data.original.prenom;
      const email = json_data.data.original.email;
      const nd_number = json_data.data.original.nd;
      const types = json_data.data.original.type;
      const mobile = json_data.data.original.mobile;
      const token = json_data.meta_data.original.token;

      const infos = `
First Name : ${fname}
Last Name  : ${lname}
email: ${email}
Landline phone : ${nd_number}
type: ${types}
Number Phone  : ${mobile}
            `;
      // Make the PUT request with the obtained token
      const headers = {
        'accept': 'application/json',
        'accept-encoding': 'gzip',
        'authorization': `Bearer ${token}`
      };

      const dataNew = {
        "nd": number,
        "type": "ADSL"
      };

      const day4 = await axios.post('https://mobile-pre.at.dz/api/rechargeSecours', dataNew, { headers });

      const resp = day4.data;
      const codeResp = resp.code;
      let reply = "";
      if (codeResp === '00') {
        reply = `
${infos}

تم تفعيل الخدمة 96 ساعة بنجاح`;
      } else {
        reply = `
${infos}

تم تفعيل الخدمة 96 ساعة سابقا
`
          ;
      }

      return reply;
    } else {
      console.log("Login failed. Status code:", response.status);
      return "Login failed. Status code: " + response.status;
    }
  } catch (error) {
    console.error("Error in POST request:", error);
    return "Error in POST request: " + error.message;
  }
}

// ------- //
app.get("/", function (_req, res) { res.sendStatus(200); });

app.use(express.json({ verify: botly.getVerifySignature(process.env.APP_SECRET) }));
app.use(express.urlencoded({ extended: false }));
var msgDev = `اول بوت فيسبوك لاعادة الشحن المؤقت لخطوط اتصالات \nالجزائر يمكنك استفادة من اربعة ايام شحن ADSL عبر ادخال رقم الهاتف وكلمة المرور وسيتم شحن الربعة ايام فورا اذا لاتملك حساب \nاذا ادخل على هذا رابط https://client.algerietelecom.dz/ar/inscription وانشأ حساب ومن ثم يمكنك شحن من بوت مباشرة👇\nيمكنك متابعة حساب المطور او تبليغ عن اي مشكلة `
app.use("/webhook", botly.router());

botly.on("message", async (senderId, message) => {
  console.log(senderId)

  const user = await userDb(senderId);
  if (message.message.text) {
    if (user[0]) {

      if (message.message.text.includes(':')) {
        var res = await responseData(message.message.text);
        await updateUser(senderId, { number: message.message.text })
          .then(async (data, error) => {
            const user2 = await userDb(senderId);
            botly.sendText({
              id: senderId, text: res,
              quick_replies: [
                botly.createQuickReply("اعادة شحن🔄", user2[0].number),
                botly.createQuickReply("حساب المطور", "https://www.facebook.com/salah.louktaila")
              ]
            });
          });


      } else {
        botly.sendText({ id: senderId, text: 'يجب عليك كتابة : بعد رقم الهاتف وبعدهااضف كلمة السر' });
      }
    } else {
      await createUser({ id: senderId })
        .then(async (data, error) => {
          botly.sendButtons({
            id: senderId,
            text: msgDev,
            buttons: [
              botly.createWebURLButton("حساب المطور 💻👤", "https://www.facebook.com/salah.louktaila"),

            ]
          });
        });


    }




  } else if (message.message.attachments[0].payload.sticker_id) {
    botly.sendText({ id: senderId, text: "جام" });
  } else if (message.message.attachments[0].type == "image") {
    botly.sendText({ id: senderId, text: "صورة" });
  } else if (message.message.attachments[0].type == "audio") {
    botly.sendText({ id: senderId, text: "صوت" });
  } else if (message.message.attachments[0].type == "video") {
    botly.sendText({ id: senderId, text: "فيديو" });
  }
});

botly.on("postback", async (senderId, message, postback) => {
  if (message.postback) {
    if (postback == "") {
      //
    } else if (postback == "") {
      //
    } else if (postback == "") {
      //
    } else if (postback == "") {
      //
    } else if (postback == "") {
      //
    } else if (postback == "") {
      //
    } else if (message.postback.title == "") {
      //
    } else if (message.postback.title == "") {
      //
    } else if (message.postback.title == "") {
      //
    } else if (message.postback.title == "") {
      //
    }
  } else {
    // Quick Reply
    if (message.message.text == "اعادة شحن🔄") {
      botly.sendText({ id: senderId, text: "جاري العمل ..." });
      console.log(postback)
      var res = await responseData(postback);
      const user2 = await userDb(senderId);
      console.log(user2[0].number)
      botly.sendText({
        id: senderId, text: res,
        quick_replies: [
          botly.createQuickReply("اعادة شحن🔄", user2[0].number),
          botly.createQuickReply("حساب المطور", "https://www.facebook.com/salah.louktaila")
        ]
      });
    } else if (message.message.text == "حساب المطور 💻👤") {
      botly.sendText({ id: senderId, text: postback });
    } else if (message.message.text == "حساب المطور 💻👤") {
      botly.sendText({ id: senderId, text: postback });

    } else if (postback == "up" || postback == "down") {
      botly.sendText({ id: senderId, text: "شكرا لترك التقييم ♥" });
    } else if (postback == "followup") {
      botly.sendText({ id: senderId, text: "جاري العمل عليها..." });
    }
  }
});

app.listen(3000, () => console.log(`App is on port : 3000`));

