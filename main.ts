
Deno.serve(async (req) => {
    // 1. 解析收到的请求 URL
  const incomingUrl = new URL(req.url);
  // 2. 从路径中提取目标 URL 的主体部分
  // .pathname => /https://api.example.com/data?id=123...
  // .slice(1) => https://api.example.com/data?id=123...
  const pathPart = incomingUrl.pathname.slice(1);
  // 3. 获取原始请求中的查询字符串部分
  const searchPart = incomingUrl.search; // => ?id=123&type=user
  // 4. 将两部分拼接成最终的目标 URL
  const targetUrlString = pathPart + searchPart;
  // 5. 验证 URL 是否有效
  if (!pathPart) { // 如果路径为空 (例如只访问了 http://localhost:8000/)
    return new Response(
      "使用方法：在地址后面加上你想要代理的目标 URL。\n例如: http://localhost:8000/https://example.com",
      { status: 400 }
    );
  }

    // 构造最终的请求 URL：原有查询参数（注意：此处不包括 setUrl 参数，因为已单独处理）
    let finalUrl: string;
    try {
      finalUrl = new URL(targetUrlString).toString();
    } catch {
    return new Response(`错误：提供的目标 URL 无效。\n收到的 URL: ${targetUrlString} \n使用方法：在地址后面加上你想要代理的目标 URL。\n例如: http://localhost:8000/https://example.com`, { status: 400 });
    }

    // 构造一个新的请求，将客户端的 method、headers 和 body 传递过去
    const proxyRequest = new Request(finalUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

    try {
      const targetResponse = await fetch(proxyRequest);
      // 使用 arrayBuffer 来支持二进制数据（比如图片等）
      const body = await targetResponse.arrayBuffer();

      // 复制目标响应的 headers
      const responseHeaders = new Headers();
      for (const [key, value] of targetResponse.headers.entries()) {
        responseHeaders.set(key, value);
      }

      return new Response(body, {
        status: targetResponse.status,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(`请求目标 URL 时发生错误：${err}`, {
        status: 500,
      });
    }
});
