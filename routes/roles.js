const router = require('koa-router')()
const util = require('../utils/util')
const Role = require('../models/roleSchema')

router.prefix('/roles')

router.get('/allList', async(ctx) => {
  try {
    const list = await Role.find({}, '_id roleName')
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(`查询失败:${error.stack}`)
  }
})

router.get('/list', async(ctx)=>{
  const { page, skipIndex } = util.pager(ctx.request.query)
  const { roleName } = ctx.request.query
  let params = {}
  if(roleName) params.roleName = roleName
  try {
    const query = Role.find(params)
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await Role.countDocuments(params)
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

router.post('/operate', async (ctx) => {
  const { _id, roleName, remark, action } = ctx.request.body
  let res, info
  try {
    if(action == 'create'){
      res = await Role.create({ roleName, remark })
      info = '创建成功'
    }else if(action == 'edit'){
      if(_id){
        let params = { roleName, remark }
        params.updateTime = new Date()
        res = await Role.findByIdAndUpdate(_id, params)
        info = '编辑成功'
      }else{
        ctx.body = util.fail('缺少参数params: _id')
        return;
      }
    }else{
      if(_id){
        res = await Role.findByIdAndRemove(_id)
        info = '删除成功'
      }else{
        ctx.body = util.fail('缺少参数params: _id')
        return;
      }
    }
    ctx.body = util.success('',info)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

router.post('/update/permission', async (ctx) => {
  const { _id, permissionList } = ctx.request.body
  try {
    let params = { permissionList, update: new Date() }
    await Role.findByIdAndUpdate(_id, params)
    ctx.body = util.success('', '权限设置成功')
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

module.exports = router