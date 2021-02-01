# coding:UTF-8

import requests
import lxml
from lxml import html
from lxml import etree
from lxml.html import tostring, html5parser
import sys

savePath = '..\js\monitordata.js'

html = requests.get("http://www.jinjing365.com/index.asp")
etree_html = etree.HTML(html.text)
content = etree_html.xpath('/html/body/script[2]/text()')

for it in content:
    startIndex = it.find('var capitals')
    endIndex = it.find('var title')
    totalIndex = sys.getsizeof(str(it))

    if startIndex > 0 and endIndex >= 0:
        print('Start Index:' + str(startIndex) +
              ' End index:' + str(endIndex))
        strInfo = str(it)[startIndex:endIndex]
        startIndex = strInfo.find('[{')
        endIndex = strInfo.find('}, ]') + 4
        strInfo = strInfo[startIndex:endIndex]
        monitorData = 'var monitorDatas = ' + strInfo

        # save path to /js/monitordata.js
        f = open(savePath, 'wb')
        f.write(bytes(monitorData, encoding='utf8'))
        f.flush()
        f.close()
        print('Monitor data parse finished!' + ' savePath:' + savePath)
