/**
 * 通用函数
 */

const log4js = require('./log4j')
const jwt = require('jsonwebtoken');

const CODE = {
  SUCCESS: 200,
  PARAM_ERROR: 10001, //参数错误
  USER_ACCOUNT_ERROR: 20001, //账户或密码错误
  USER_LOGIN_ERROR: 30001, //用户未登录
  BUSINESS_ERROR: 40001, //业务请求失败
  AUTH_ERROR: 50001, //认证失败或TOKEN过期
}

module.exports = {

  /**
   * 分页结构封装
   * @param {number} pageNum 
   * @param {number} pageSize 
   * @returns 
   */
  pager({ pageNum = 1, pageSize = 10 }){
    pageNum*=1
    pageSize*=1
    const skipIndex = (pageNum-1)*pageSize
    return {
      page: {
        pageNum,
        pageSize
      },
      skipIndex
    }
  },
  success(data='', msg='', code=CODE.SUCCESS){
    log4js.debug(data)
    return {
      code, data, msg
    }
  },
  fail(msg='', code=CODE.BUSINESS_ERROR){
    log4js.debug(msg)
    return {
      code, msg
    }
  },
  CODE,
  decoded(authorization){
    if(authorization){
      let token = authorization.split(' ')[1]
      return jwt.verify(token, 'poker')
    }
    return ''
  },
  getTreeList(rootList, id, list){
    for(let i=0;i<rootList.length;i++){
      let item = rootList[i]
      if(String(item.parentId.slice().pop()) == String(id)){
        list.push(item._doc)
      }
    }
    list.map(item => {
      item.children = []
      this.getTreeList(rootList, item._id, item.children)
      if(item.children.length==0){
        delete item.children
      }else if(item.children[0].menuType == 2){
        item.action = item.children
      }
    })
    return list
  },
  deepCopy(obj) {
    let result = Array.isArray(obj) ? [] : {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object') {
          result[key] = this.deepCopy(obj[key]);   // 递归复制
        } else {
          result[key] = obj[key];
        }
      }
    }
    return result;
  },
  formatDate(date, rule){
    let ret
    let fmt = rule || 'yyyy-MM-dd hh:mm:ss'
    const o = {
      'y+': date.getFullYear(),
      'M+': date.getMonth()+1,
      'd+': date.getDate(),
      'h+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds()
    }
    for(let k in o){
      ret = new RegExp("("+k+")").exec(fmt);
      if(ret){
        let val = o[k] + ''
        fmt = fmt.replace(ret[1], ret[1].length == 1 ? val:val.padStart(ret[1].length,"0"))
      }
    }
    return fmt
  },
}