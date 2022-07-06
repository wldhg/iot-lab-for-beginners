import React from 'react';
import Document, {
  DocumentContext, Html, Head, Main, NextScript,
} from 'next/document';

// Note : this is written with class type component beacuse next.js supports it
// This must include only "static" things like innerHTML
class AppDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return initialProps;
  }

  render() {
    return (
      <Html>
        <Head>
          <link
            crossOrigin="anonymous"
            href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.4/dist/web/static/pretendard-dynamic-subset.css"
            rel="stylesheet"
          />
          <link
            crossOrigin="anonymous"
            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body>
          <noscript>
            <em>JavaScript가 꺼져 있습니다. 완전한 페이지 표시를 위해 JavaScript를 켜 주세요.</em>
          </noscript>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default AppDocument;
