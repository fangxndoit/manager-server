const router = require('koa-router')()
const util = require('../utils/util')
const Dept = require('../models/deptSchema')

router.prefix('/dept')

router.get('/list', async(ctx)=>{
  let { deptName } = ctx.request.query
  let params = {}
  if(deptName) params.deptName = deptName
  let rootList = await Dept.find(params)
  try {
    if(deptName){
      ctx.body = util.success(rootList)
    }else{
      let treeList = util.getTreeList(rootList, null, [])
      ctx.body = util.success(treeList)
    }
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

router.post('/operate', async(ctx)=>{
  const { _id, action, ...params } = ctx.request.body
  let res, info
  try {
    if(action=='create'){
      res = await Dept.create(params)
      info ='创建成功'
    }else if(action=='edit'){
      params.updateTime = new Date()
      res = await Dept.findByIdAndUpdate(_id, params)
    }else if(action == 'delete'){
      res = await Dept.findByIdAndRemove(_id)
      await Dept.deleteMany({ parentId: { $all: [_id]} })
      info = '删除成功'
    }
    ctx.body = util.success('', info)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

module.exports = router