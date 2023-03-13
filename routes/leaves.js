const router = require('koa-router')()
const util = require('../utils/util')
const Dept = require('../models/deptSchema')
const Leave = require('../models/leaveSchema')

router.prefix('/leave')

router.get('/list', async(ctx)=>{
  const { page, skipIndex } = util.pager(ctx.request.query)
  const { applyState, type } = ctx.request.query
  let authorization = ctx.request.headers.authorization
  let { data } = util.decoded(authorization)
  try {
    let params = {}
    if(type == 'approve'){
      if(applyState == 1||applyState == 2){
        params.curAuditUserName = data.userName
        params.$or = [{applyState:1},{applyState:2}]
      }else if(applyState >2){
        params = {
          'auditFlows.userId': data.userId,
          applyState
        }
      }else{
        params = {
          'auditFlows.userId': data.userId
        }
      }
    }else{
      params = {
        'applyUser.userId': data.userId
      }
      if(applyState!=0) params.applyState = applyState
    }
    
    const query = Leave.find(params)
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await Leave.countDocuments(params)
    ctx.body = util.success({
      list,
      page: {
        ...page, total
      }
    })
  } catch (error) {
    ctx.body = util.fail(`查询失败:${error.stack}`)
  }
})

router.post('/operate', async(ctx)=>{
  const { _id, action, ...params } = ctx.request.body
  let authorization = ctx.request.headers.authorization
  let { data } = util.decoded(authorization)
  let res, info
  try {
    if(action == 'create'){
      let orderNo = "XJ"
      orderNo+=util.formatDate(new Date(),"yyyyMMdd")
      const total = await Leave.countDocuments()
      params.orderNo = orderNo + total

      let id = data.deptId.pop()
      let dept = await Dept.findById(id)
      let userList = await Dept.find({ deptName: { $in:  ['人事部门','财务部门'] } })
      
      let auditFlows = [
        { userId: dept.userId, userName: dept.userName, userEmail:dept.userEmail }
      ]
      userList.map(item=>{
        auditFlows.push(
          { userId: item.userId, userName: item.userName, userEmail:item.userEmail }
        )
      })
      params.auditUsers = auditFlows.map(item=>item.userName).join(',')
      params.curAuditUserName = dept.userName
      params.auditFlows = [...auditFlows]
      params.auditLogs = []
      params.applyUser = {
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail
      }
      res = await Leave.create(params)
      info = '创建成功'
    }else{
      res = await Leave.findByIdAndUpdate(_id,{ applyState: 5 })
      info = '删除成功'
    }
    ctx.body = util.success('',info)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

router.post('/approve',async(ctx) => {
  const { _id, action, remark } = ctx.request.body
  let authorization = ctx.request.headers.authorization
  let { data } = util.decoded(authorization)
  let params = {}
  try {
    // 1:待审批 2:审批中 3:拒绝 4:通过 5:作废
    let doc = await Leave.findById(_id)
    let auditLogs = doc.auditLogs || []
    if(action == 'refuse'){
      params.applyState = 3
    }else{
      if(doc.auditFlows.length == doc.auditLogs.length){
        ctx.body = util.success('当前申请单已处理，请勿重复提交')
        return;
      }else if(doc.auditFlows.length == doc.auditLogs.length +1){
        params.applyState = 4
      }else if(doc.auditFlows.length > doc.auditLogs.length){
        params.applyState = 2
        params.curAuditUserName = doc.auditFlows[doc.auditLogs.length+1].userName
      }
    }
    auditLogs.push({
      userId: data.userId,
      userName: data.userName,
      createTime: new Date(),
      remark,
      action: action=='refuse'?'审核拒绝':'审核通过'
    })
    params.auditLogs = auditLogs
    await Leave.findByIdAndUpdate(_id, params)
    ctx.body = util.success('','处理成功')
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }

})

router.get('/count', async(ctx) => {
  let authorization = ctx.request.headers.authorization
  let { data } = util.decoded(authorization)
  try {
    let params = {}
    params.curAuditUserName = data.userName
    params.$or = [{applyState:1},{applyState:2}]
    const total = await Leave.countDocuments(params)
    ctx.body = util.success(total)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

module.exports = router