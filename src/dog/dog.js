const utils = require("../../utils/utils");
const dbOpen = require("../../conf/cfg.json").db.open;

/**
 * 添加操作dog数据
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 async function add(req,res,next) {
    let ctx = req.ctx || {};
    let params = req.params || {};

    let data = await ctx.tables.Dog.create({
        name : params.name,
        room_id : params.roomId,
        socket_id : params.socketId,
        device : params.device,
        flag : params.flag,
        content : params.content,
        handshake : params.handshake
    });

    if(res){
        res.json(data)
    }else {
        return data;
    }
}


/**
 * 获取操作统计信息
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 async function getDogManageInfo(req, res, next) {
    let ctx = req.ctx || {};
    let params = req.params || {};
    let data = {
        transferFileToday : 0,
        transferFileAll : 0,
        transferFileSizeTodady : 0,
        transferTxtTodady : 0,
        transferTxtAll : 0,
        transferCommTxtToday : 0,
        transferCommTxtAll : 0,
        fileList : [],
        txtList : [],
        commTxtList : [],
    };

    //今日传输聚合列表
    const [transferListToday, metadata] = await ctx.sql.query(`select name, room_id, content, handshake, created_at from dog where created_at >= "${utils.formateDateTime(new Date(), "yyyy-MM-dd")}" order by created_at desc`);

    //发送文件
    let fileTransferList = transferListToday.filter(element=>{
        return element.name === '准备发送文件'
    })
    data.transferFileToday += fileTransferList.length;
    fileTransferList.forEach(element=>{
        let content = JSON.parse(element.content);
        data.fileList.push({
            room : element.room_id || content.room,
            name : content.name,
            size : parseInt(content.size / 1024 / 1024) === 0 ? (content.size / 1024 / 1024).toFixed(2) : parseInt(content.size / 1024 / 1024),
            createTime : utils.formateDateTime(new Date(element.created_at), "yyyy-MM-dd hh:mm:ss"),
        })
        data.transferFileSizeTodady += content.size
    })
    data.transferFileSizeTodady = parseInt(data.transferFileSizeTodady / 1024 / 1024)


    //发送文本内容
    let txtTransferList = transferListToday.filter(element=>{
        return element.name === '发送文本内容'
    })
    data.transferTxtTodady += txtTransferList.length;
    txtTransferList.forEach(element => {
        let content = JSON.parse(element.content);
        data.txtList.push({
            room : element.room_id || content.room,
            content : decodeURIComponent(content.content),
            size : decodeURIComponent(content.content).length,
            createTime : utils.formateDateTime(new Date(element.created_at), "yyyy-MM-dd hh:mm:ss"),
        })
    });


    //公共聊天室
    let commTxtTransferList = transferListToday.filter(element=>{
        return element.name === '公共聊天室'
    })
    data.transferCommTxtToday += commTxtTransferList.length;
    commTxtTransferList.forEach(element => {
        data.commTxtList.push({
            room : element.room_id,
            content : element.content,
            size : element.content.length,
            createTime : utils.formateDateTime(new Date(element.created_at), "yyyy-MM-dd hh:mm:ss"),
        })
    });

    
    //全部数量统计
    const [transferAll, metadata1] = await ctx.sql.query(`select name, count(*) as user from dog group by name`);
    transferAll.forEach(element=>{ 
        if(element.name === '准备发送文件'){
            data.transferFileAll += element.user
        }
        if(element.name === '发送文本内容'){
            data.transferTxtAll += element.user
        }
        if(element.name === '公共聊天室'){
            data.transferCommTxtAll += element.user
        }
    })

    if (res) {
         res.json(data)
    } else {
         return data;
    }
}



module.exports = dbOpen ? {
    add,
    getDogManageInfo
}: {
    add : function(){},
    getDogManageInfo : function(){},
}