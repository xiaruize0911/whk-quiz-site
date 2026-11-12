// Offline copy of the site. Generated from tools/sw-template.js by tools/build_sw.py; do not edit sw.js.
// Every file the site needs is saved under the exact URL the page asks for (app.js?v=…), so a
// saved page only ever pairs with its own scripts and data. A new deploy gets a new VERSION;
// files whose content did not change are copied from the old cache instead of downloaded again.
const VERSION = "b81f09fb8f15";
const CACHE = `whk-quiz-${VERSION}`;
const PRECACHE = [
  ["index.html", "f2bee87911a4", 15279],
  ["./", "f2bee87911a4", 15279],
  ["app.js?v=20261112b", "ff5c9dceb819", 120702],
  ["styles.css?v=20261112a", "86ddd95b58c7", 63666],
  ["manifest.webmanifest", "26ebc6b56980", 668],
  ["favicon.ico", "6f68a67725b1", 5190],
  ["data/questions.js?v=20261111b", "90153e2cab98", 1877886],
  ["data/analysis/biology.json?v=20261111b", "5bef2db77cde", 642100],
  ["data/analysis/chemistry.json?v=20261111b", "64fa57a855b0", 357507],
  ["data/analysis/chinese.json?v=20261111b", "d638f11409fa", 152286],
  ["data/analysis/english.json?v=20261111b", "aed7bc5d8be3", 432011],
  ["data/analysis/math.json?v=20261111b", "0016192ce708", 366559],
  ["data/analysis/physics.json?v=20261111b", "c5a2249a4fdb", 255358],
  ["data/assets/biology/image001.jpg", "b7b4b1f20b61", 7391],
  ["data/assets/biology/image002.png", "ecdb0f874d33", 15277],
  ["data/assets/biology/image003.png", "a09dd7331610", 12017],
  ["data/assets/biology/image004.png", "1730a8c559cd", 42024],
  ["data/assets/biology/image005.png", "e6c0aab85415", 21289],
  ["data/assets/biology/image006.png", "8704c626bd54", 27647],
  ["data/assets/biology/image007.png", "c4db2c5f5c5a", 17191],
  ["data/assets/biology/image008.png", "3369d68adcf3", 6009],
  ["data/assets/biology/image009.png", "094741ce085e", 107180],
  ["data/assets/biology/image010.png", "8384f7412e5c", 4433],
  ["data/assets/biology/image011.png", "10899fad7fd3", 31200],
  ["data/assets/biology/image012.png", "69c98b2370d3", 10734],
  ["data/assets/biology/image014.png", "5b7f7bd93e61", 9600],
  ["data/assets/biology/image015.png", "ffe56769da0e", 71696],
  ["data/assets/biology/image016.png", "1d674b054c95", 18831],
  ["data/assets/biology/image017.png", "a0f879e1ced2", 22664],
  ["data/assets/biology/image018.jpg", "ba9c74ed0c2d", 11423],
  ["data/assets/biology/image019.png", "dcde2e460373", 23256],
  ["data/assets/biology/image020.png", "ae1d8f28d91b", 33654],
  ["data/assets/biology/image021.png", "3aa40ddb3ff9", 4790],
  ["data/assets/biology/image022.png", "af93291061d3", 44190],
  ["data/assets/biology/image023.png", "94eb58d1f768", 356],
  ["data/assets/biology/image024.png", "deae9a445645", 353],
  ["data/assets/biology/image025.png", "7a4b9a7fc933", 363],
  ["data/assets/biology/image026.png", "54bbe5f4544f", 156224],
  ["data/assets/biology/image027.png", "fad42a220aa9", 10106],
  ["data/assets/biology/image028.png", "3dd25302e0be", 28917],
  ["data/assets/biology/image029.png", "85375670e459", 46901],
  ["data/assets/biology/image030.png", "016097c721c1", 8577],
  ["data/assets/biology/image031.png", "f14808a44a66", 2172],
  ["data/assets/biology/image032.png", "91468e7443bb", 44314],
  ["data/assets/biology/image033_hires.jpg", "aa5c8029365d", 62373],
  ["data/assets/biology/image034.png", "9699380f715c", 1922],
  ["data/assets/biology/image035.png", "8506bfe742f4", 1924],
  ["data/assets/biology/image036.png", "189beeee45ef", 1866],
  ["data/assets/biology/image037.png", "3c40b748c2d5", 1977],
  ["data/assets/biology/image038.png", "517640049ac6", 17112],
  ["data/assets/biology/image039.jpg", "3e93ce203d3c", 3086],
  ["data/assets/biology/image040.png", "cb8bdb783381", 1031],
  ["data/assets/biology/image041.jpg", "4affe53890e8", 6042],
  ["data/assets/biology/image042.png", "8718dafbf1d7", 15249],
  ["data/assets/biology/image043.png", "163c974d4fed", 53679],
  ["data/assets/biology/image044.png", "11752d94a28b", 45123],
  ["data/assets/biology/image045.png", "f7a7ff3e1fd8", 5478],
  ["data/assets/biology/image046.png", "85a5e7175dda", 12754],
  ["data/assets/biology/image047.png", "cd3b4fb68820", 9319],
  ["data/assets/biology/image048.png", "ff7e80f7c864", 7195],
  ["data/assets/biology/image049.png", "c5d05b6baa1d", 68486],
  ["data/assets/biology/image050.png", "613a91d99835", 73936],
  ["data/assets/biology/image051.png", "bdcdf13a9686", 13374],
  ["data/assets/biology/image052.png", "6fe2b8cf60c8", 7808],
  ["data/assets/biology/image053.png", "7d9b3d910253", 536],
  ["data/assets/biology/image054.png", "841d4fd0fb8f", 106673],
  ["data/assets/biology/image055.png", "62ab0206669f", 4423],
  ["data/assets/biology/image056.png", "c5edbf57bb7f", 19217],
  ["data/assets/biology/image057.png", "33aff83a66ba", 3231],
  ["data/assets/biology/image058.png", "a222b7ea5545", 232910],
  ["data/assets/biology/image059.png", "f7f0e4dec602", 9965],
  ["data/assets/biology/image060.jpg", "9f4d0fdbd451", 4868],
  ["data/assets/biology/image061.png", "868aa3ec873f", 2354],
  ["data/assets/biology/image062.png", "40e1ce3fda4c", 6519],
  ["data/assets/biology/image063.png", "eeba8831b0bc", 5512],
  ["data/assets/biology/image064.png", "dc6abe1ffdb6", 9703],
  ["data/assets/chemistry/docx-image20-w688.png", "05222fd5841e", 55385],
  ["data/assets/chemistry/docx-image22-w710.png", "d73cc6a7963e", 59636],
  ["data/assets/chemistry/docx-image32.png", "5bf711cc367c", 13178],
  ["data/assets/chemistry/docx-image37-w498.png", "46dd22cf4d06", 36145],
  ["data/assets/chemistry/docx-image38-w86.jpg", "7d648582b90f", 3800],
  ["data/assets/chemistry/docx-image41.png", "6549336604f4", 22770],
  ["data/assets/chemistry/image001.png", "3722eb3d3a12", 998],
  ["data/assets/chemistry/image002-w48.png", "61a5adf6837b", 2322],
  ["data/assets/chemistry/image004-w108.png", "e85c6a5b73c9", 2687],
  ["data/assets/chemistry/image005.png", "6dfaec071eee", 791],
  ["data/assets/chemistry/image006.png", "d19692b9446e", 1137],
  ["data/assets/chemistry/image007-w62.png", "b4201e5d21ae", 1542],
  ["data/assets/chemistry/image008-w51.png", "1bc85a7dc534", 3154],
  ["data/assets/chemistry/image009-w66.png", "30013b2413f0", 2475],
  ["data/assets/chemistry/image010.png", "d4ce967db002", 477],
  ["data/assets/chemistry/image011-w57.png", "8a855705d69d", 1400],
  ["data/assets/chemistry/image012-w46.png", "0cd9401d02c4", 2663],
  ["data/assets/chemistry/image014.png", "122eb97ffe83", 640],
  ["data/assets/chemistry/image015.png", "86c4734b3411", 546],
  ["data/assets/chemistry/image016.png", "1f2d05c2464f", 6485],
  ["data/assets/chemistry/image017.png", "ec5e17d9d877", 6070],
  ["data/assets/chemistry/image018-w62.png", "023a7a6872ca", 2498],
  ["data/assets/chemistry/image019.png", "49367854efb6", 528],
  ["data/assets/chemistry/image020.png", "bdd00060e017", 307],
  ["data/assets/chemistry/image021.png", "bf772daf17e2", 303],
  ["data/assets/chemistry/image022.png", "9e012fbdfe04", 929],
  ["data/assets/chemistry/image031-w172.png", "d07933e45618", 9430],
  ["data/assets/chemistry/image033-w726.png", "a428121d8387", 35939],
  ["data/assets/chemistry/image034.png", "012b2b2e8239", 6912],
  ["data/assets/chemistry/image035.png", "4eb913acf70f", 3527],
  ["data/assets/chemistry/image036.png", "013908f9a357", 3694],
  ["data/assets/chemistry/image037-w180.png", "0eb904af8129", 20088],
  ["data/assets/chemistry/image038.png", "18710aae315b", 2194],
  ["data/assets/chemistry/image039-w174.png", "ddcdaed1eb43", 9482],
  ["data/assets/chemistry/image040.png", "eed232e0a463", 7761],
  ["data/assets/chemistry/image042-w704.png", "e8ed1147dbe4", 36611],
  ["data/assets/chemistry/image044.png", "6e1ffd1bc1cc", 7917],
  ["data/assets/chemistry/image045.png", "fcc68ebf0b46", 2941],
  ["data/assets/chemistry/image046.png", "237bfa513548", 330],
  ["data/assets/chemistry/image047.png", "838b57cb16d8", 4546],
  ["data/assets/chemistry/image051-w592.png", "30d8a007cac8", 47969],
  ["data/assets/math/math-093-option-A.png", "b304dbf3678b", 4731],
  ["data/assets/math/math-093-option-B.png", "911057096442", 4956],
  ["data/assets/math/math-093-option-C.png", "2e0133b505b7", 4718],
  ["data/assets/math/math-093-option-D.png", "fbf325a23dde", 4806],
  ["data/assets/math/math-104-option-A.png", "287bb2756a4c", 5493],
  ["data/assets/math/math-104-option-B.png", "ea09b1d99200", 4834],
  ["data/assets/math/math-104-option-C.png", "8c1de58eb3c0", 5155],
  ["data/assets/math/math-104-option-D.png", "7c59fe38b6d4", 5181],
  ["data/assets/math/math-121-option-A.png", "68c0ea506a61", 3303],
  ["data/assets/math/math-121-option-B.png", "735430c282b5", 3090],
  ["data/assets/math/math-121-option-C.png", "c943aa155226", 3574],
  ["data/assets/math/math-121-option-D.png", "85d1d0d7df30", 3504],
  ["data/assets/math/math-122-option-A.png", "23794126eec0", 8251],
  ["data/assets/math/math-122-option-B.png", "48d8164761de", 8163],
  ["data/assets/math/math-122-option-C.png", "69607af8cd32", 8036],
  ["data/assets/math/math-122-option-D.png", "0e4b71065cac", 7800],
  ["data/assets/math/math-123-option-A.png", "8976fc63aeef", 3597],
  ["data/assets/math/math-123-option-B.png", "0f0e76336dbb", 3613],
  ["data/assets/math/math-123-option-C.png", "2334ba1bd0d2", 3670],
  ["data/assets/math/math-123-option-D.png", "315939bcdd88", 3621],
  ["data/assets/math/math-141-option-A.png", "986b91ee260b", 4869],
  ["data/assets/math/math-141-option-B.png", "f9754267a019", 4855],
  ["data/assets/math/math-141-option-C.png", "151988fc34be", 4936],
  ["data/assets/math/math-141-option-D.png", "5888018e2b41", 4908],
  ["data/assets/math/math-image10.png", "cc639d72e63f", 12458],
  ["data/assets/math/math-image11.png", "2ee2e815bb43", 9172],
  ["data/assets/math/math-image12.png", "c47f1f737fa3", 20995],
  ["data/assets/math/math-image14.png", "fb435fc007a4", 26179],
  ["data/assets/math/math-image16.png", "a311b4a39e6d", 15225],
  ["data/assets/math/math-image17.png", "b4f1ced87de5", 15399],
  ["data/assets/math/math-image18.png", "0c45ebe4abfc", 10266],
  ["data/assets/math/math-image2.png", "078f1e204df2", 6919],
  ["data/assets/math/math-image23.png", "dcc1799d072f", 18911],
  ["data/assets/math/math-image24.png", "799e8228f24e", 26119],
  ["data/assets/math/math-image25.png", "8ea00ba425f0", 24664],
  ["data/assets/math/math-image26.png", "c8aa8add9fb9", 16805],
  ["data/assets/math/math-image28.png", "ab53bbe56213", 7323],
  ["data/assets/math/math-image29.png", "fcadd70a3875", 7549],
  ["data/assets/math/math-image30.png", "7b3fa156c0c6", 6191],
  ["data/assets/math/math-image31.png", "6d10a0837721", 11871],
  ["data/assets/math/math-image32.png", "36ab8f93fa85", 8632],
  ["data/assets/math/math-image33.png", "fcaa21a33e7c", 10633],
  ["data/assets/math/math-image34.png", "e495a166d3e9", 15484],
  ["data/assets/math/math-image35.png", "d769d9115808", 14903],
  ["data/assets/math/math-image39.png", "5e3fd7086a5a", 10330],
  ["data/assets/math/math-image41.png", "ecb67988772b", 7476],
  ["data/assets/math/math-image42.png", "b7b4a739307c", 11750],
  ["data/assets/math/math-image43.png", "8192d191fcd7", 24157],
  ["data/assets/math/math-image44.png", "9d2293800f53", 3778],
  ["data/assets/math/math-image7.png", "76959f879e6a", 16765],
  ["data/assets/math/math-image8.png", "6b2c7b23b4c9", 17224],
  ["data/assets/math/math-image9.png", "f5ed536824ed", 19371],
  ["data/assets/physics/image001.jpg", "bf5e021711d8", 10128],
  ["data/assets/physics/image002.jpg", "8285d5dca6b6", 12230],
  ["data/assets/physics/image003.jpg", "d2ad290583a0", 2904],
  ["data/assets/physics/image004.jpg", "cc76460b9a46", 7211],
  ["data/assets/physics/image005.jpg", "a8d95cda11a3", 1995],
  ["data/assets/physics/image006.jpg", "7023159e7d91", 2041],
  ["data/assets/physics/image007.jpg", "9c201e0b9749", 2046],
  ["data/assets/physics/image008.jpg", "f3cfaf7bc34e", 2042],
  ["data/assets/physics/image009.jpg", "3ee7ea3c5e3f", 1073],
  ["data/assets/physics/image010.jpg", "d609575e4a58", 1074],
  ["data/assets/physics/image011.jpg", "7bf32df62000", 14936],
  ["data/assets/physics/image012.jpg", "f963311b2608", 5838],
  ["data/assets/physics/image013.jpg", "5125b230dc02", 8103],
  ["data/assets/physics/image014.jpg", "a15936443088", 8541],
  ["data/assets/physics/image015.jpg", "3cb829ba0a5c", 2214],
  ["data/assets/physics/image016.jpg", "465f3114d3f8", 965],
  ["data/assets/physics/image017.jpg", "faf0dca9a69f", 991],
  ["data/assets/physics/image018.jpg", "b3622f54f791", 999],
  ["data/assets/physics/image019.jpg", "a78749fd8baa", 1029],
  ["data/assets/physics/image020.jpg", "cdbf386f297d", 1030],
  ["data/assets/physics/image021.jpg", "1763e581bfa6", 1028],
  ["data/assets/physics/image022.jpg", "786748111d9e", 4442],
  ["data/assets/physics/image023.jpg", "a3565bced673", 928],
  ["data/assets/physics/image024.jpg", "a1a5680cd4b0", 953],
  ["data/assets/physics/image025.jpg", "4d70f2c1a016", 2217],
  ["data/assets/physics/image026.jpg", "db7a1dfdb8e7", 996],
  ["data/assets/physics/image027.jpg", "02c046a3d605", 916],
  ["data/assets/physics/image028.jpg", "c8ff22763f93", 918],
  ["data/assets/physics/image029.jpg", "ec1723d934ec", 1302],
  ["data/assets/physics/image030.jpg", "d49c5fd3afb0", 1307],
  ["data/assets/physics/image031.jpg", "f0aedaf20967", 1353],
  ["data/assets/physics/image032.jpg", "fd0d9bebfd4f", 1395],
  ["data/assets/physics/image033.jpg", "665b52662ad2", 2224],
  ["data/assets/physics/image034.jpg", "1b6470501c70", 1011],
  ["data/assets/physics/image035.jpg", "f0117c0fae40", 922],
  ["data/assets/physics/image036.jpg", "724031ca23ef", 963],
  ["data/assets/physics/image037.jpg", "742b6500c37d", 985],
  ["data/assets/physics/image038.jpg", "e8d208f8a9ea", 1132],
  ["data/assets/physics/image039.jpg", "460474beb9ee", 1135],
  ["data/assets/physics/image040.jpg", "9580283585ee", 1349],
  ["data/assets/physics/image041.jpg", "435900d455cf", 1323],
  ["data/assets/physics/image042.jpg", "907e9f5c3975", 2052],
  ["data/assets/physics/image043.jpg", "b0b3fe590fa0", 995],
  ["data/assets/physics/image044.jpg", "004dad34526f", 1003],
  ["data/assets/physics/image045.jpg", "8451d61e8996", 980],
  ["data/assets/physics/image046.jpg", "fac9695b5c5e", 995],
  ["data/assets/physics/image047.jpg", "5999373adce5", 987],
  ["data/assets/physics/image048.jpg", "3d59ce211fcf", 1018],
  ["data/assets/physics/image049.jpg", "d25c9ee35b08", 2586],
  ["data/assets/physics/image050.jpg", "d06fed4c69a3", 921],
  ["data/assets/physics/image051.jpg", "04d3a616ecfc", 950],
  ["data/assets/physics/image052.jpg", "dfdeb95fea25", 2152],
  ["data/assets/physics/image053.jpg", "4d8506821c61", 2850],
  ["data/assets/physics/image054.jpg", "aebcec325cb5", 6418],
  ["data/assets/physics/image055.jpg", "92a3ea9d0e7a", 2121],
  ["data/assets/physics/image056.jpg", "611008c32460", 3770],
  ["data/assets/physics/image057.jpg", "2a58959539bb", 3250],
  ["data/assets/physics/image058.jpg", "5af41f11b4ee", 1043],
  ["data/assets/physics/image059.jpg", "0a8c2d3d8dcf", 2764],
  ["data/assets/physics/image060.jpg", "7134f2730ce3", 2841],
  ["data/assets/physics/image061.jpg", "96432f63fdb1", 2348],
  ["data/assets/physics/image062.jpg", "ed8fa964e0a1", 1019],
  ["data/assets/physics/image063.jpg", "0737659951ff", 1022],
  ["data/assets/physics/image064.jpg", "6741d59af0ca", 1020],
  ["data/assets/physics/image065.jpg", "f982e5e04ede", 1022],
  ["data/assets/physics/image066.jpg", "0073130901bd", 1239],
  ["data/assets/physics/image067.jpg", "769e05b627b5", 1242],
  ["data/assets/physics/image068.jpg", "f1cdee7d7e9c", 926],
  ["data/assets/physics/image069.jpg", "005b9c1e0d96", 2647],
  ["data/assets/physics/image070.jpg", "69faa1cc75ab", 7644],
  ["data/assets/physics/image071.jpg", "d5533106f331", 1024],
  ["data/assets/physics/image072.jpg", "de5ee62595b5", 1022],
  ["data/assets/physics/image073.jpg", "60c8f78693db", 7146],
  ["data/assets/physics/image074.jpg", "9c658b8101db", 9014],
  ["data/assets/physics/image075.jpg", "69921d65c50b", 1290],
  ["data/assets/physics/image076.jpg", "0cb3ce663125", 5472],
  ["data/assets/physics/image077.jpg", "104ff3b724a7", 1592],
  ["data/assets/physics/image078.jpg", "16d3d1657495", 1673],
  ["data/assets/physics/image079.jpg", "6bc5c6fbc892", 1618],
  ["data/assets/physics/image080.jpg", "e97efe944348", 1483],
  ["data/assets/physics/image081.jpg", "f5a57b4676c8", 7745],
  ["data/assets/physics/image082.jpg", "771fef508dfa", 24966],
  ["data/assets/physics/image083.jpg", "9ceca45d4601", 32115],
  ["data/assets/physics/image084.jpg", "b976cd5d034c", 33417],
  ["data/assets/physics/image085.jpg", "88b2d105a66f", 3444],
  ["data/assets/physics/image086.jpg", "a278054e5d3e", 1490],
  ["data/assets/physics/image087.jpg", "2b7a69f886d5", 2976],
  ["data/assets/physics/image088.jpg", "baffe4b8af21", 2707],
  ["data/assets/physics/image089.jpg", "a77fc78d4574", 3269],
  ["data/assets/physics/image090.jpg", "5060996e57f2", 7212],
  ["data/assets/physics/image091.jpg", "871a1f6605b5", 4270],
  ["data/assets/physics/image092.jpg", "13c439fa8f00", 5678],
  ["data/assets/physics/image094.jpg", "541fcbde6842", 3219],
  ["data/assets/physics/image095.jpg", "a50a5e222c15", 2954],
  ["data/assets/physics/image096.jpg", "4ca7ab8ba282", 2508],
  ["data/assets/physics/image097.jpg", "6523a3705a1a", 3877],
  ["data/assets/physics/image098.jpg", "450c4594ccd6", 3354],
  ["data/assets/physics/image099.jpg", "95b26a6431c3", 2784],
  ["data/assets/physics/physics-006-option-A.png", "528d58c91798", 5413],
  ["data/assets/physics/physics-006-option-B.png", "09523ad3e5b7", 10721],
  ["data/assets/physics/physics-006-option-C.png", "b8e2a776ecc1", 9727],
  ["data/assets/physics/physics-006-option-D.png", "abebcb83d492", 10164],
  ["data/assets/physics/physics-012-option-A.png", "8a6872feb170", 13111],
  ["data/assets/physics/physics-012-option-B.png", "b1936c27cc37", 11352],
  ["data/assets/physics/physics-012-option-C.png", "bff4a88a487e", 14262],
  ["data/assets/physics/physics-012-option-D.png", "f6dbdd3db8b7", 11403],
  ["data/assets/physics/physics-018-option-A.png", "2dd821530f4e", 9005],
  ["data/assets/physics/physics-018-option-B.png", "8a14478c5a32", 12805],
  ["data/assets/physics/physics-018-option-C.png", "cbefc3c81e08", 13604],
  ["data/assets/physics/physics-018-option-D.png", "8785195b0acf", 7346],
  ["data/assets/physics/physics-022-option-A.png", "19b02ec03695", 10986],
  ["data/assets/physics/physics-022-option-B.png", "74d9f48ac4e5", 9180],
  ["data/assets/physics/physics-022-option-C.png", "36f34bf0ddfb", 16888],
  ["data/assets/physics/physics-022-option-D.png", "6fe860098944", 13123],
  ["data/assets/physics/physics-032-option-A.png", "40db55615e5e", 5260],
  ["data/assets/physics/physics-032-option-B.png", "a70255e237dd", 6162],
  ["data/assets/physics/physics-032-option-C.png", "c3b61cc1a8a6", 7029],
  ["data/assets/physics/physics-032-option-D.png", "1ed8ae6520f2", 5449],
  ["data/assets/physics/physics-crop-k03-q2.png", "a3370f43b37c", 44680],
  ["data/assets/physics/physics-crop-k04-q3.png", "ae5d2126604b", 41987],
  ["data/assets/physics/physics-crop-k06-q4.png", "8a7d743be390", 19634],
  ["data/assets/physics/physics-crop-k18-q3.png", "747fe01cd1e9", 4507],
  ["data/assets/physics/physics-crop-k19-q4-tape.png", "1f98ea6aba47", 6379],
  ["icons/apple-touch-icon.png", "3a3c54a3445f", 15197],
  ["icons/icon-192.png", "8ccac6eb0a12", 15455],
  ["icons/icon-512.png", "63867c9b3380", 139344],
  ["icons/icon-maskable-512.png", "1e74104919b2", 50703],
  ["icons/icon.svg", "c9c1d1ac6150", 777],
  ["icons/mark.svg", "458f9bdaf18e", 678],
  ["media/yuwen-midterm-recitation.mp3", "850f7cf0083e", 1760256],
  ["vendor/mathjax/LICENSE", "cfc7749b96f6", 11358],
  ["vendor/mathjax/input/tex/extensions/action.js", "37b44965893d", 2611],
  ["vendor/mathjax/input/tex/extensions/all-packages.js", "b44661fc134a", 215178],
  ["vendor/mathjax/input/tex/extensions/ams.js", "624d59b8b858", 29459],
  ["vendor/mathjax/input/tex/extensions/amscd.js", "7dc7256ebc58", 6769],
  ["vendor/mathjax/input/tex/extensions/autoload.js", "7656bc471cb7", 6357],
  ["vendor/mathjax/input/tex/extensions/bbox.js", "73d208a3425e", 3006],
  ["vendor/mathjax/input/tex/extensions/boldsymbol.js", "d6771fee0772", 4056],
  ["vendor/mathjax/input/tex/extensions/braket.js", "2abb032ca0ea", 6729],
  ["vendor/mathjax/input/tex/extensions/bussproofs.js", "47c46e011949", 18344],
  ["vendor/mathjax/input/tex/extensions/cancel.js", "0d263ecf2671", 3326],
  ["vendor/mathjax/input/tex/extensions/cases.js", "9c11e0644dab", 7064],
  ["vendor/mathjax/input/tex/extensions/centernot.js", "a1e4be1e20d1", 3477],
  ["vendor/mathjax/input/tex/extensions/color.js", "7fdc8f7cda16", 8627],
  ["vendor/mathjax/input/tex/extensions/colortbl.js", "d9c0e39634f4", 5392],
  ["vendor/mathjax/input/tex/extensions/colorv2.js", "30c09ca19b5d", 1998],
  ["vendor/mathjax/input/tex/extensions/configmacros.js", "a6d4604cbd3a", 4676],
  ["vendor/mathjax/input/tex/extensions/empheq.js", "f425b835aeb4", 11100],
  ["vendor/mathjax/input/tex/extensions/enclose.js", "8804f756f369", 2387],
  ["vendor/mathjax/input/tex/extensions/extpfeil.js", "d8d5ecd75abc", 3451],
  ["vendor/mathjax/input/tex/extensions/gensymb.js", "9f55af256604", 2104],
  ["vendor/mathjax/input/tex/extensions/html.js", "e3647c848f26", 2969],
  ["vendor/mathjax/input/tex/extensions/mathtools.js", "04272d69a0b6", 31845],
  ["vendor/mathjax/input/tex/extensions/mhchem.js", "aec2e1e1c423", 38270],
  ["vendor/mathjax/input/tex/extensions/newcommand.js", "a41669a4ae92", 11768],
  ["vendor/mathjax/input/tex/extensions/noerrors.js", "9317a33b00e1", 1226],
  ["vendor/mathjax/input/tex/extensions/noundefined.js", "b90ecf838a6f", 1852],
  ["vendor/mathjax/input/tex/extensions/physics.js", "83d5ad43ea47", 24029],
  ["vendor/mathjax/input/tex/extensions/require.js", "d508f823c2cf", 6286],
  ["vendor/mathjax/input/tex/extensions/setoptions.js", "a259b86c9f49", 5549],
  ["vendor/mathjax/input/tex/extensions/tagformat.js", "a1407f0ba6ab", 2864],
  ["vendor/mathjax/input/tex/extensions/textcomp.js", "6eaa4c938145", 6808],
  ["vendor/mathjax/input/tex/extensions/textmacros.js", "cd783f048f64", 16138],
  ["vendor/mathjax/input/tex/extensions/unicode.js", "903e7d0d11d5", 3450],
  ["vendor/mathjax/input/tex/extensions/upgreek.js", "4335d722671b", 2676],
  ["vendor/mathjax/input/tex/extensions/verb.js", "fdaface3c13d", 2562],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_AMS-Regular.woff", "3de784d07b9f", 40808],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Calligraphic-Bold.woff", "af04542b29ea", 9908],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Calligraphic-Regular.woff", "26683bf201fb", 9600],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Fraktur-Bold.woff", "721921bab0d0", 22340],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Fraktur-Regular.woff", "870673df72e7", 21480],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Main-Bold.woff", "88b98cad3688", 34464],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Main-Italic.woff", "355254db9ca1", 20832],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Main-Regular.woff", "1cb1c39ea642", 34160],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Math-BoldItalic.woff", "8ea8dbb1b02e", 19776],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Math-Italic.woff", "a009bea404f7", 19360],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Math-Regular.woff", "c01d3321e89b", 19288],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_SansSerif-Bold.woff", "32792104b5ef", 15944],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_SansSerif-Italic.woff", "fc6ddf5df402", 14628],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_SansSerif-Regular.woff", "b418136e3b38", 12660],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Script-Regular.woff", "af96f67d7acc", 11852],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Size1-Regular.woff", "c49810b53ecc", 5792],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Size2-Regular.woff", "30e889b58cbc", 5464],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Size3-Regular.woff", "5cda41563a09", 3244],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Size4-Regular.woff", "3bc6ecaae7ec", 5148],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Typewriter-Regular.woff", "c56da8d69f1a", 17604],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Vector-Bold.woff", "36e0d72d8a7a", 1116],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Vector-Regular.woff", "72bc573386dd", 1136],
  ["vendor/mathjax/output/chtml/fonts/woff-v2/MathJax_Zero.woff", "481e39042508", 1368],
  ["vendor/mathjax/tex-chtml.js?v=3.2.2", "0a6ded5abbce", 1160989],
]; // [url relative to the site, content hash, bytes]

const scopeUrl = (path) => new URL(path, self.registration.scope).href;
let progress = { cached: 0, total: PRECACHE.length };

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("whk-quiz-") && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
    broadcast();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "offline-status") {
    status().then((data) => event.source?.postMessage(data));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? page(request) : asset(request));
});

async function precache() {
  const cache = await caches.open(CACHE);
  const older = (await caches.keys()).filter((key) => key.startsWith("whk-quiz-") && key !== CACHE);
  let cached = 0;
  const queue = [...PRECACHE];
  const worker = async () => {
    while (queue.length) {
      const [path, rev] = queue.shift();
      const url = scopeUrl(path);
      if (!(await cache.match(url))) {
        const response = (await fromOlder(older, url, rev)) || (await download(url, rev));
        await cache.put(url, response);
      }
      cached += 1;
      progress = { cached, total: PRECACHE.length };
      if (cached % 20 === 0) broadcast();
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
}

async function fromOlder(older, url, rev) {
  for (const key of older) {
    const response = await (await caches.open(key)).match(url);
    if (response && response.headers.get("x-offline-rev") === rev) return response;
  }
  return null;
}

async function download(url, rev) {
  const response = await fetch(url, { cache: "reload" });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const headers = new Headers(response.headers);
  headers.set("x-offline-rev", rev);
  return new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers });
}

// The page itself: fresh when online, the saved copy when not.
async function page(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(CACHE);
    return (await cache.match(scopeUrl("./"))) || (await cache.match(scopeUrl("index.html"))) || Response.error();
  }
}

async function asset(request) {
  const cache = await caches.open(CACHE);
  let response = await cache.match(request.url);
  if (!response) {
    try {
      return await fetch(request);
    } catch (error) {
      // Offline and asked for a version we don't have: any saved copy of the file beats nothing.
      response = await cache.match(request.url, { ignoreSearch: true });
      if (!response) return Response.error();
    }
  }
  const range = request.headers.get("range");
  return range ? partial(response, range) : response;
}

// Audio players ask for byte ranges; answer them from the saved file.
async function partial(response, range) {
  const body = await response.arrayBuffer();
  const size = body.byteLength;
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  let start = match && match[1] ? Number(match[1]) : 0;
  let end = match && match[2] ? Number(match[2]) : size - 1;
  if (match && !match[1] && match[2]) {
    start = Math.max(0, size - Number(match[2]));
    end = size - 1;
  }
  end = Math.min(end, size - 1);
  if (start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  return new Response(body.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

async function status() {
  const cache = await caches.open(CACHE);
  const keys = new Set((await cache.keys()).map((request) => request.url));
  const cached = PRECACHE.filter(([path]) => keys.has(scopeUrl(path))).length;
  const bytes = PRECACHE.reduce((sum, [, , size]) => sum + size, 0);
  return {
    type: "offline-status",
    version: VERSION,
    cached: Math.max(cached, progress.cached),
    total: PRECACHE.length,
    done: cached === PRECACHE.length,
    megabytes: (bytes / 1048576).toFixed(1),
  };
}

async function broadcast() {
  const data = await status();
  (await self.clients.matchAll({ includeUncontrolled: true })).forEach((client) => client.postMessage(data));
}
