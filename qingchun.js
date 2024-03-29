var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var i = 0;
var baseUrl = "http://www.mm131.com/qingchun/";
var url = baseUrl+ "2435_43.html"; 
var iconv = require('iconv-lite');

var maxnum = 8888; //抓取总条数
//初始url 
function fetchPage(x) {     //封装了一层函数
    startRequest(x); 
}


function startRequest(x) {
     //采用http模块向服务器发起一次get请求      
    http.get(x, function (res) {     
       //用来存储请求网页的整个html内容
        var html = [];
        var len = 0;      
        // res.setEncoding('utf-8'); //防止中文乱码
     //监听data事件，每次取一块数据
      res.on('data', function(chrunk) {
        html.push(chrunk);
        len += chrunk.length;
      });

     //监听end事件，如果整个网页内容的html都获取完毕，就执行回调函数
        res.on('end', function () {
            var data = Buffer.concat(html, len);
             data = iconv.decode(data, 'gb2312');

         var $ = cheerio.load(data); //采用cheerio模块解析html

        // 获取标题

         var title = $('.content h5').text().trim();
       
         //文章发布时间
         var time = $('.content .content-msg').text().trim();
         // 获取下一个url
         var nextUrlObj = $('.content-page .page-ch').last();

         // 如果有href 说明有下一页

         if(nextUrlObj.attr('href')){
          var nextUrl = baseUrl+nextUrlObj.attr('href');
         }else{
          // 如果没有下一页  获取下一组
            var nextUrl = $('.updown .updown_l').attr('href');
         }
         var list = {
            title: title,
            Time: time,   
            url: x,
            nextUrl:nextUrl,
        //i是用来判断获取了多少篇文章
            i: i = i + 1,     
            };

  console.log(list);     //打印信息
  console.log(nextUrl);
  // savedContent($,news_title);  //存储每篇文章的内容及文章标题

  savedImg($,list);    //存储每篇文章的图片及图片标题

 
            //通过控制I,可以控制爬取多少篇文章.
            if (i <= maxnum) {                
                fetchPage(nextUrl);
            }

        });

    }).on('error', function (err) {
        console.log(err);
    });

}
       //该函数的作用：在本地存储所爬取的内容资源
function savedContent($, news_title) {

    $('.article-content p').each(function (index, item) {
        var x = $(this).text();       

       var y = x.substring(0, 2).trim();

        if (y == '') {
        x = x + '\n';   
//将文本内容一段一段添加到/data文件夹下，并用标题来命名文件
        fs.appendFile('./data/' + news_title + '.txt', x, 'utf-8', function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
    })
}
//该函数的作用：在本地存储所爬取到的图片资源
function savedImg($,news_title) {

    $('.content-pic img').each(function (index, item) {
        var img_title = $(this).attr('alt').trim();  //获取图片的标题
        if(img_title.length>55||img_title==""){
         img_title="Null";}
        var img_filename = img_title + '.jpg';

        var img_src = $(this).attr('src'); //获取图片的url
console.log(img_src);
//采用request模块，向服务器发起一次请求，获取图片资源
        request.head(img_src,function(err,res,body){
            if(err){
                console.log(err);
            }
        });
        request(img_src).pipe(fs.createWriteStream('./image/qingchun/'+img_title + '---' + img_filename));     //通过流的方式，把图片写到本地/image目录下，并用新闻的标题和图片的标题作为图片的名称。
    })
}
fetchPage(url);