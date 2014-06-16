<?
$key = $_GET["text"];

echo '{
    "data": [
        {
            "text": "s1-'.$key.'",
            "id": "244"
        },
        {
            "text": "s2-'.$key.'",
            "id": "444"
        },
        {
            "text": "s3-'.$key.'",
            "id": "544"
        },
        {
            "text": "s4-'.$key.'",
            "id": "744"
        },
        {
            "text": "s5-'.$key.'",
            "id": "844"
        }
    ]
}';

?>