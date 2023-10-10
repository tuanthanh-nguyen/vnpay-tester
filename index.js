require('dotenv').config({})
const crypto = require('node:crypto')
const fs = require('node:fs')
const assert = require('node:assert')
const axios = require('axios')

const PRIVATE_KEY_RSA = fs.readFileSync('./vnpay_private_key_prd.pem')
const SECRET_KEY = process.env.SECRET_KEY

const requestId = generateRandomString(8)
const requestTime = '25092023000000'
const ewMobile = '0965338450'
const partnerId = '1234'
const ewCustomerName = 'Nguyễn Văn A'
const ewCustomerId = '123456789'
const otp = '123456'

run()

async function run() {
     const data_link_request = await getdDataLinkRequest(requestId, requestTime, ewMobile, partnerId, ewCustomerName, ewCustomerId)
     assert(data_link_request !== null)
     assert(data_link_request.code === '00')
     assert(typeof data_link_request?.data?.confirmId === 'string')
     console.log('/link-request', data_link_request)

    // get confirmID
    const confirmId = data_link_request.data.confirmId

    const data_link_confirm = await getdDataLinkConfirm(requestId, requestTime, ewMobile, partnerId, ewCustomerName, ewCustomerId, confirmId, otp)
    assert(data_link_confirm !== null)
    assert(data_link_confirm.code === '00')
    assert(typeof data_link_confirm?.data?.ewAccNo === 'string')
    console.log('/link-confirm', data_link_confirm)

    const tripId = 'd0948d0d-2798-4f7d-91a9-61415cb562f9-1694161223403324103'
    const eWalletMobileNo = '0912345678'
    const eWalletAcc = '1234567890'
    const vnPayFeeAmount = null || '0' // must required, if null then translat to be zero
    const incomeAmount = 35000
    const payOnBeHalfcheckSum = sign_Hmac('' + tripId + '|' + eWalletMobileNo + '|' + eWalletAcc + '|' + incomeAmount + '|' + vnPayFeeAmount + '|' + SECRET_KEY, SECRET_KEY)
    const pay_on_behalf = await payOnBehalfVnpay(
        tripId, 
        eWalletMobileNo,
        eWalletAcc,
        incomeAmount,
        vnPayFeeAmount,
        payOnBeHalfcheckSum
    )
    assert(pay_on_behalf !== null)
    assert(pay_on_behalf.data.statusCode === '400')
    console.log('/pay-for-driver', pay_on_behalf)

    const driverIncomeCheckSum = sign_Hmac('' + tripId + '|' + SECRET_KEY, SECRET_KEY)
    const query_driver_income = await queryDriverIncome(
        tripId,
        driverIncomeCheckSum
    )
    assert(query_driver_income !== null)
    assert(query_driver_income.data.statusCode === '400')
    console.log('/query-driver-income-txn', query_driver_income)
}

function sign_Hmac(s, secret) {
    return crypto.createHmac('sha256', secret).update(s).digest("hex");
}

async function queryDriverIncome(tripId, checkSum) {
  return axios.post('https://mbapi.vnpaytest.vn/vntaxi/emddi/query-driver-income-txn',
      {
          tripId,
          checkSum
      },
      {
          headers: {
              'app-id': 'SDK_VNTAXI_EXT_EMDDI',
          }
      }
  ).then(res => res.data).catch(_ => null)
}

async function payOnBehalfVnpay(tripId, eWalletMobileNo, eWalletAcc, incomeAmount, vnpayFeeAmount, checkSum) {
  return axios.post('https://mbapi.vnpaytest.vn/vntaxi/emddi/pay-for-driver',
      {
          tripId,
          eWalletMobileNo,
          eWalletAcc,
          incomeAmount,
          vnpayFeeAmount,
          checkSum
      },
      {
          headers: {
              'app-id': 'SDK_VNTAXI_EXT_EMDDI',
          }
      }
  ).then(res => {
      console.log(res)
      return res.data
  }).catch(_ => null)
}

async function getdDataLinkConfirm(requestId, requestTime, ewMobile, partnerId, ewCustomerName, ewCustomerId, confirmId, otp) {
    return axios.post(
        'https://vnticket.vnpaytest.vn/ew-ic-api/ecosystem/ewallet/link-confirm',
        {
            requestId,
            requestTime,
            ewMobile,
            partnerId,
            ewCustomerName,
            ewCustomerId,
            confirmId,
            otp,
            signature: sign_with_private_key(requestId + requestTime + ewMobile + confirmId + otp, PRIVATE_KEY_RSA),
        },
        {
            headers: {
                'app-id': 'SDK_VNTAXI_EXT_EMDDI',
            }
        }
    ).then(res => res.data).catch(_ => null)
}
async function getdDataLinkRequest(requestId, requestTime, ewMobile, partnerId, ewCustomerName, ewCustomerId) {
    return axios.post(
        'https://vnticket.vnpaytest.vn/ew-ic-api/ecosystem/ewallet/link-request',
        {
            requestId,
            requestTime,
            ewMobile,
            partnerId,
            ewCustomerName,
            ewCustomerId,
            signature: sign_with_private_key(requestId + requestTime + ewMobile, PRIVATE_KEY_RSA),
        },
        {
            headers: {
                'app-id': 'SDK_VNTAXI_EXT_EMDDI',
            }
        }
    ).then(res => res.data).catch(_ => null)
}

function sign_with_private_key(s, pk) {
    const sign = crypto.createSign('SHA256')
    sign.write(s)
    sign.end()
    const signature = sign.sign(pk, 'base64')
    return signature.toString('base64')
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
  }

  return randomString;
}
