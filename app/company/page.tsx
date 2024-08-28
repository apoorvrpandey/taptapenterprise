
import React from 'react'
import CompanyPage from '../../components/CompanyPage'

export default function Page({searchParams}) {

  console.log(searchParams)



  
 
  return (
   <div style={{fontFamily: 'Roboto'}}>
   <CompanyPage company={searchParams.company} tab={searchParams.tab || 'overview'} />
   </div>
  )
}
