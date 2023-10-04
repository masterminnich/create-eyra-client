import '../css/style.css'
import React from 'react';
import Head from 'next/head';

function MyApp({Component, pageProps}){
    return (
        <>
            <Head>
                <title>Eyra</title>
                <link rel="icon" href="/icon_256x256.ico" />
            </Head>
            <Component {...pageProps} />
        </>
    )
}

export default MyApp