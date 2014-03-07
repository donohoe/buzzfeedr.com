<?php

//	Copy Latest Quartz feed every x minutes

function get_content($url) {

    if(!$curld = curl_init($url)) {
        echo "Could not connect to the specified resource";
           exit;
    }
    $ch = curl_init();
    $useragent = "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.1) Gecko/20061204 Firefox/2.0.0.1";

    print "\n<br/>Getting article: $url ";

    curl_setopt ($ch, CURLOPT_USERAGENT, $useragent);
    curl_setopt ($ch, CURLOPT_HEADER, 0);
    curl_setopt ($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt ($ch, CURLOPT_URL, $url);
    curl_setopt ($ch, CURLOPT_COOKIEJAR, "curl_cookie.txt");

    ob_start();
    curl_exec ($ch);

    curl_close ($ch);
    $string = ob_get_contents();
    ob_end_clean();

    print "(" . strlen($string) . ")";

    return $string;    
}

function save_json($data) {
    $filename = '/PATH/buzzfeedr.com/data/quartz.js'; /* DONT FORGET TO UPDATE THIS */
	$data = "var Quartz = " . $data;

    if (file_exists($filename)) {
		$h = fopen($filename, 'w');
		fwrite($h, $data); 
		fclose($h);
    }
}

/*
** BEGIN
*/

$json = get_content("qz.com/api/top");
save_json($json);

?>
