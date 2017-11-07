import os
import sys
import subprocess
import shutil
import queue
import hashlib as hl
import threading
from threading import Thread

def md5_chksum(fname):
    """
    Calculates the md5 checksum of the given file at location.
    """
    md5 = hl.md5()

    # open file and read in blocks
    with open(fname, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            md5.update(chunk)

    return md5.hexdigest()

def new_proj():
    result = subprocess.check_output(['../../Request.sh', 'new_proj'])
    result = result.decode('utf-8').strip()
    results = result.split('\n')
    _id = results[-2].split(':')[0]

    return _id

def infer_samples(_id, md5s):
    result = subprocess.check_output(['../../Request.sh', 'infer_samples', '--id', _id])
    result = result.decode('utf-8').strip()

    same = True

    for fname, md5 in md5s.items():
        if fname in result:
            print('.', end='')
        else:
            same = False
            print('\n{} not in result'.format(fname))

        if md5 in result:
            print('x', end='')
        else:
            same = False
            print('\n{} not in result'.format(md5))

    print()
    return same

def test_read_quant(ids):
    md5s = {'mt1': {'abundance.h5': '18e19b26635e4300fd4dc7944635d1b9',
                    'abundance.tsv': 'c454fde411b6f5d7f01b9d575417ded2',
                    'bs_abundance_0.tsv': 'dffec751379aee6bd0e0705b60332474',
                    'bs_abundance_1.tsv': '52a4fd1225214740f8c497a00f0a367c',
                    'bs_abundance_10.tsv': 'e218e20c73dc12585c9b9fa7c4c5f467',
                    'bs_abundance_11.tsv': '24e6480039a97911f76713df9bfdc768',
                    'bs_abundance_12.tsv': '68b79ce9389499867a66aea3e4273f91',
                    'bs_abundance_13.tsv': '7d5e38356d22fd805848ecfc42a23af7',
                    'bs_abundance_14.tsv': '265045e8fc733fb173adc5238f7f9ef0',
                    'bs_abundance_15.tsv': '7a6201aeca86df0b1d2aba7cad4ec131',
                    'bs_abundance_16.tsv': '9678fb8d5857b43b9617636a95474307',
                    'bs_abundance_17.tsv': '8067cf7c2b4b23db9d84c53635b9beef',
                    'bs_abundance_18.tsv': '6dc43423790c3cf2a13c43b220c0de32',
                    'bs_abundance_19.tsv': '3567ecff621feff81a2123426cbf1a90',
                    'bs_abundance_2.tsv': '46b67c3a2ee5dc2545864b610c2fdd27',
                    'bs_abundance_20.tsv': '10bff0075d2ae00da5020cea23d5d8d4',
                    'bs_abundance_21.tsv': '6c8228b963f10e9da2e777220c52a3d3',
                    'bs_abundance_22.tsv': '9cf09fb89290a1092404e12ba8b14745',
                    'bs_abundance_23.tsv': '9b305b91019af82adfa893c21bd94e06',
                    'bs_abundance_24.tsv': 'bbc3dd6a8e75066a316bef45cda9780d',
                    'bs_abundance_25.tsv': 'e283737890ac2ef7df4f67474f33b712',
                    'bs_abundance_26.tsv': 'fae8ac9a3b6bb13d6b573e80a1d343bf',
                    'bs_abundance_27.tsv': '9cca8becbee68b1e35fae707390a966c',
                    'bs_abundance_28.tsv': '54dbf44bfa20c5efa88a371356930173',
                    'bs_abundance_29.tsv': 'c7a886973920af4490ec4041953fe7f1',
                    'bs_abundance_3.tsv': 'ac1aa6c3621054e47cd536668c0b7498',
                    'bs_abundance_30.tsv': 'b3bf2c823d047b4e248891d672252a2a',
                    'bs_abundance_31.tsv': 'a0ca9e77db8fe71b395e2c0da557cbde',
                    'bs_abundance_32.tsv': '93a41be9bf6ee5d00329db1f59ca4c5a',
                    'bs_abundance_33.tsv': '15eb7c19b5920eebfce462f3e673dd4f',
                    'bs_abundance_34.tsv': 'f283392521500f047d532a7850de03f8',
                    'bs_abundance_35.tsv': '6ce337bd84785326491617a9c290bd23',
                    'bs_abundance_36.tsv': '42b8b86a42d158e9f3b79ef497465940',
                    'bs_abundance_37.tsv': 'cab46ed2f6fbbc573200cb31a77e9af6',
                    'bs_abundance_38.tsv': 'a0ddc6e886c9572a5903f50427bd50f9',
                    'bs_abundance_39.tsv': '7c5deb19853e522ef0dbb8cc969f3998',
                    'bs_abundance_4.tsv': 'a669b00fb0eb9d6db2aac972674ce925',
                    'bs_abundance_40.tsv': 'fee60461a584554e81b614a3e6b3e348',
                    'bs_abundance_41.tsv': 'cfce867bf6b335701b4752adb1e00f6e',
                    'bs_abundance_42.tsv': 'f9f6265400f2c127e7e0dcb5c9b847f1',
                    'bs_abundance_43.tsv': '3118383738b8ff3799750ddffd2ca613',
                    'bs_abundance_44.tsv': 'fda931b40fb09449901f98ce84b9505b',
                    'bs_abundance_45.tsv': 'c605cb9c3b85d371b3189960b2c42a5c',
                    'bs_abundance_46.tsv': '0eb4d1396cde3ba015587b5ef029e7c3',
                    'bs_abundance_47.tsv': '08e60e878eaa6f84503bf14f72dbb44e',
                    'bs_abundance_48.tsv': '1d2cc167e9a3d4051ee16eb814f500ec',
                    'bs_abundance_49.tsv': 'fbfc788e7b40626f1ef177954863a829',
                    'bs_abundance_5.tsv': 'b367eb760131620cec5ce885137a773a',
                    'bs_abundance_50.tsv': '4f84d0ba19636c0a355b8f4afcf3220b',
                    'bs_abundance_51.tsv': 'bf060401c7bfb6864748e04864653283',
                    'bs_abundance_52.tsv': '3c1a13754fd38e00122888846ae50ee9',
                    'bs_abundance_53.tsv': 'c041c69a271e1a79f5bb7699cd51eaea',
                    'bs_abundance_54.tsv': '93545da857e1fab53569cac057328081',
                    'bs_abundance_55.tsv': '912328e66ff92f0e59b5e0363215628d',
                    'bs_abundance_56.tsv': '2e597ab7006356db65e981c02cfd62bb',
                    'bs_abundance_57.tsv': 'd353dbb6b512fdef16f1786e45cd7d30',
                    'bs_abundance_58.tsv': '82d6074bfc03c6b9578c26856305294d',
                    'bs_abundance_59.tsv': '849d77ebf5382ded9fec484b58732e8c',
                    'bs_abundance_6.tsv': '6eb26f83f7ab3d0ffb3932f8035c9431',
                    'bs_abundance_60.tsv': '0327a8e8fb871f1503f785111f37aaa9',
                    'bs_abundance_61.tsv': '22983c3b28d75cd331f30e02ead02456',
                    'bs_abundance_62.tsv': '8a806eb6853e85b9afe1fb18dba8947f',
                    'bs_abundance_63.tsv': 'd10de99d0d09186f2bf82aae5f388b26',
                    'bs_abundance_64.tsv': '47c22505ff0dec9628c8756986489af2',
                    'bs_abundance_65.tsv': 'e221e155494318bbd924af3c4e486486',
                    'bs_abundance_66.tsv': 'fe760b969f824b99f3796d06c2e2c05f',
                    'bs_abundance_67.tsv': 'ac40e0272c88a28da0cc8d9d18961019',
                    'bs_abundance_68.tsv': '49cbe5255561e0ec597614da2bf6d4bb',
                    'bs_abundance_69.tsv': '9efa652cc0a6ccda484f4696ea189c03',
                    'bs_abundance_7.tsv': 'adb7d24523860beb5662cad2f55ecb4a',
                    'bs_abundance_70.tsv': 'ee8a3b0aae56de8aa499f1a12eaeb935',
                    'bs_abundance_71.tsv': 'aa154ad0e59e3d183572026732dfb0e4',
                    'bs_abundance_72.tsv': '5e004e1a062beea326dd02a115f818c8',
                    'bs_abundance_73.tsv': 'e47a1b7966396cdafd5815f916eb6981',
                    'bs_abundance_74.tsv': 'e7ccebf343c82a07737c45fdbaf6de5d',
                    'bs_abundance_75.tsv': 'fc5f5076d1fd5a742a65415fa08ccfb1',
                    'bs_abundance_76.tsv': 'a55099126b57bd05fc671ac190bb4b11',
                    'bs_abundance_77.tsv': '74d690d7ae39c0a919188b455a727d71',
                    'bs_abundance_78.tsv': '83c4678e384dd2ac106dfb7e5f1aa021',
                    'bs_abundance_79.tsv': 'cd50bc4f38bdc73039f4a073558f910a',
                    'bs_abundance_8.tsv': '1468f2109ba72e96ad400f979d83d1c0',
                    'bs_abundance_80.tsv': '757ba29303b0805a2d5b0117f5f8c869',
                    'bs_abundance_81.tsv': '06ecad36bf1a2fa90c05ea8535407abd',
                    'bs_abundance_82.tsv': 'ac5c0fadd4f21fe02d35ba9d16a2f061',
                    'bs_abundance_83.tsv': '8706afc7ca2527aba4aed0aaca3c683e',
                    'bs_abundance_84.tsv': 'fd0041b783324eea4d81db9cf2a1bc52',
                    'bs_abundance_85.tsv': '094c9c704a1d2a01e1dff2812397a527',
                    'bs_abundance_86.tsv': '49656f9d19a0eed3dceefd94d6cbf2ea',
                    'bs_abundance_87.tsv': '9a2afa652436c6b045cd8a44347ee03d',
                    'bs_abundance_88.tsv': '0b48593f6ca526bf016cd48115b350fe',
                    'bs_abundance_89.tsv': '45f46126ff05ef6881233cf8df50aa61',
                    'bs_abundance_9.tsv': '3e4842db5b118def2d58e3d8e1487528',
                    'bs_abundance_90.tsv': '3b4cac3410a0b778a49d5819afed21ac',
                    'bs_abundance_91.tsv': '6a477667e807afc687d7f0d4cd5d45eb',
                    'bs_abundance_92.tsv': 'e72a2c91aab749253b74d34565e5b084',
                    'bs_abundance_93.tsv': '1c3f06d564209cfcaadd3547d44f1e01',
                    'bs_abundance_94.tsv': '3a1e15043250cc18981610412547cfa0',
                    'bs_abundance_95.tsv': 'd864f0b812ab6db4c46617811af5de25',
                    'bs_abundance_96.tsv': '77ef9e5a5a1f36de7037dd4a9e302b58',
                    'bs_abundance_97.tsv': 'cc1edb9797ba244a8ffc02fc2382cf99',
                    'bs_abundance_98.tsv': 'd4d49e8364afada3e4910377072f1e7b',
                    'bs_abundance_99.tsv': '814c164823838b7c93a2022546d4943d',
                    'run_info.json': '802f5708307f580819e888b28b4aed5b'},
            'mt2': {'abundance.h5': '09226f235687d9e38db360f115e2abbf',
                    'abundance.tsv': 'd4ed767adb992e41ab477ba68c948e19',
                    'bs_abundance_0.tsv': '053ef3164ce283cf447942f3497dfab1',
                    'bs_abundance_1.tsv': '5879aa7a04cd355599ea4168343240fc',
                    'bs_abundance_10.tsv': 'e0f360d23733ef4f70292c3e03a466ec',
                    'bs_abundance_11.tsv': 'ad037a33ac185046ea8d6214776f3b3f',
                    'bs_abundance_12.tsv': '02d9e1a89493d99b06c95136ba178e24',
                    'bs_abundance_13.tsv': '34f149f93812faab0c28043ad1df7041',
                    'bs_abundance_14.tsv': 'f9e27a842834510a8f836899e9c46b6f',
                    'bs_abundance_15.tsv': '068f056dfcff7fb99010bc4f9c25706d',
                    'bs_abundance_16.tsv': 'e5a3609e8cef51bd638eda76443ef172',
                    'bs_abundance_17.tsv': '4c2c95c7c0da2bf6c01ba4c3006a66e0',
                    'bs_abundance_18.tsv': '4a20b472aa619cda59dbb45f620c7d0e',
                    'bs_abundance_19.tsv': '093f42713d5deffc3e7c1e222796b36a',
                    'bs_abundance_2.tsv': 'b5414983d33909aa08f052050c89f217',
                    'bs_abundance_20.tsv': 'ec538481a95018f85e7cd5f4d285f66e',
                    'bs_abundance_21.tsv': '5f376260406248cde7be07d8aad7304f',
                    'bs_abundance_22.tsv': '8982d120f1330a61e13e0940df3645c9',
                    'bs_abundance_23.tsv': '1a5bcb501b9436f68f84f3890674a62c',
                    'bs_abundance_24.tsv': '8461adc81566244ec4bdbcfc71036d31',
                    'bs_abundance_25.tsv': '1033ad357389741d103187c6e893dcc1',
                    'bs_abundance_26.tsv': '8099b55197230eb10ba939e53f1cdae2',
                    'bs_abundance_27.tsv': 'be9da0d85f1636ab94fc7a8350909b9e',
                    'bs_abundance_28.tsv': 'a4e20780ffd2f97fc8e2a474cfa11bb1',
                    'bs_abundance_29.tsv': '31da7d5e1cb8f6aa837c4a23dfca045b',
                    'bs_abundance_3.tsv': '03a03e1a1ce7df5e9a080bec1ad87200',
                    'bs_abundance_30.tsv': '70aebbac112e38bcc69e2349fa5d9841',
                    'bs_abundance_31.tsv': '8158e46d809587654972345eed9aeefe',
                    'bs_abundance_32.tsv': 'd6955aeb64c11698291bf43538231791',
                    'bs_abundance_33.tsv': '477d557e424e00fae6222ef5fab2b730',
                    'bs_abundance_34.tsv': 'e6395c3829765a762e332b59dc2cfb08',
                    'bs_abundance_35.tsv': '00d29b6de9d33b7593de039a86ec10dd',
                    'bs_abundance_36.tsv': '68d880dde9584438cd0a7705d34f0c52',
                    'bs_abundance_37.tsv': '809e687dd144bb9324b6ceef1399e04c',
                    'bs_abundance_38.tsv': '4300dd6d0733726b6d4f2ebaae572d64',
                    'bs_abundance_39.tsv': 'bb10f9e392905842df0abadd53b27fd7',
                    'bs_abundance_4.tsv': '78710d139db1df92543ca9c5535de15c',
                    'bs_abundance_40.tsv': 'ac199e19dbf8b80d9c0f177742024769',
                    'bs_abundance_41.tsv': '18f064e7de58eca6801578a155f71fac',
                    'bs_abundance_42.tsv': '2c857fc3386996989b823df8422b7c7d',
                    'bs_abundance_43.tsv': '664cdfa73eaa69b57880d952ff8f827d',
                    'bs_abundance_44.tsv': 'd103abc9f145afe69c8d3382ac6d35db',
                    'bs_abundance_45.tsv': 'b45506bee4f9f564a651946bc9761e38',
                    'bs_abundance_46.tsv': 'e13969000eaccf0364ddf663350b68f7',
                    'bs_abundance_47.tsv': 'c93468cf5fab98edb880eba759125119',
                    'bs_abundance_48.tsv': '9cf40f680825246069a1f24c775ccc83',
                    'bs_abundance_49.tsv': '91cbe755af7cada7abefa2c2615c715b',
                    'bs_abundance_5.tsv': '506e02e4ad23a3ae0be63fea6097e0db',
                    'bs_abundance_50.tsv': 'fd168b48f41133dc0d89ba1952bc4368',
                    'bs_abundance_51.tsv': 'bc1ceb05c4caa4dd82a41839c747c871',
                    'bs_abundance_52.tsv': '3f36280f002a42ed45fee588457542c9',
                    'bs_abundance_53.tsv': '929bc94d1d95e03c0f26ab3719d9a332',
                    'bs_abundance_54.tsv': '7d469926f4d6e7695078590b103c2a27',
                    'bs_abundance_55.tsv': 'a3065808f108ea4f5f3d899f26841e40',
                    'bs_abundance_56.tsv': '3ad1f26e66a6425e5462fdbeb8bc6dd2',
                    'bs_abundance_57.tsv': '2cfd8fd8ce0c18340972059ae8c0c306',
                    'bs_abundance_58.tsv': 'b3ec89f0d2da80ee7135917de3274ae2',
                    'bs_abundance_59.tsv': 'f4e85d70a8ac675ce1a5ff3f69ecf7a3',
                    'bs_abundance_6.tsv': 'f8ca6432829694111f41728746d630f4',
                    'bs_abundance_60.tsv': '2e51034f409587e7eca92013e6f718df',
                    'bs_abundance_61.tsv': '772e8d7b58a9ade800c9d866c8184223',
                    'bs_abundance_62.tsv': 'e3e88d0e09f8c210b13e0694fefc72e1',
                    'bs_abundance_63.tsv': 'c40c5a83e4e46adb3087dc00ae8eb545',
                    'bs_abundance_64.tsv': '7d905b7961347883813cd2b4626a74ca',
                    'bs_abundance_65.tsv': 'b42b46cf8430c0b44e24ed2088c72c4d',
                    'bs_abundance_66.tsv': '8e7137b27ada3345535a69d271ca4c49',
                    'bs_abundance_67.tsv': 'c3f08113c043beed5bd60d9316151615',
                    'bs_abundance_68.tsv': '2222f22fd9981ca3aee4a960526b3080',
                    'bs_abundance_69.tsv': '5a1a6852c689fc7a061745008958c45e',
                    'bs_abundance_7.tsv': '2ae77ce9de2027c0f77ebd02f525609b',
                    'bs_abundance_70.tsv': '42606eb9e36a9a18bb58038fea2c9e22',
                    'bs_abundance_71.tsv': '9a83c39e0e7c1576a15d601b798d9058',
                    'bs_abundance_72.tsv': '958503b55644e3ce327cc4257ea5ca07',
                    'bs_abundance_73.tsv': '5b449fa979f13e5394861c8ecb7ede6f',
                    'bs_abundance_74.tsv': '843864a6366400e2a89162239d48435e',
                    'bs_abundance_75.tsv': 'cd90d5a0fcba0a4d0e892ad38fa9d4dd',
                    'bs_abundance_76.tsv': 'db250387f2a6993fc4b5c85b4aaba9f2',
                    'bs_abundance_77.tsv': '89f8a5b95562f0f023da327a866ea4ac',
                    'bs_abundance_78.tsv': '4624d855e0ea3d735bad767678036594',
                    'bs_abundance_79.tsv': 'c1050dac160b4dc26b22558f15a793b7',
                    'bs_abundance_8.tsv': '8ec7229611b912dd964a52b8cce1fbeb',
                    'bs_abundance_80.tsv': 'fe4b693d6d6e97585cc3d04af21ade3a',
                    'bs_abundance_81.tsv': '3b29cf7e8a51f28a4e4ef436a7c5fd74',
                    'bs_abundance_82.tsv': '8a99c60e21715dd11e6c294e5960822f',
                    'bs_abundance_83.tsv': 'cad5bcbf4e083d67f7c051a12678b406',
                    'bs_abundance_84.tsv': 'e007a8d635be31072820d31d4ef2af2b',
                    'bs_abundance_85.tsv': 'da3fe8486044d19cc8ee7770f2c005c0',
                    'bs_abundance_86.tsv': '3fe14d22464a4b691fae5407af18f997',
                    'bs_abundance_87.tsv': 'a3060430b5a17b20f0f906ea19a52c20',
                    'bs_abundance_88.tsv': 'e5028b212ebcbd8042ec02901e31378e',
                    'bs_abundance_89.tsv': '22dd83a40223e7636b30d929007f78d0',
                    'bs_abundance_9.tsv': '686da5c49b0d9957271a5ebecc64aeb1',
                    'bs_abundance_90.tsv': '80d111aad29a73301233ab4ca8c5d973',
                    'bs_abundance_91.tsv': '55eb92c2d3f72980bacbd48556ddbcad',
                    'bs_abundance_92.tsv': 'be98d8ceac768d250ed49c8576d7ac51',
                    'bs_abundance_93.tsv': '027e08f0476ee690215f350958f6836f',
                    'bs_abundance_94.tsv': '640455d0747767e6b70905952d4f40b3',
                    'bs_abundance_95.tsv': '79dd3f214fc8fd08adaf23961dc5d8f6',
                    'bs_abundance_96.tsv': '482814b4940dcd3ee2f03feddd896a08',
                    'bs_abundance_97.tsv': 'f432acf7ad7c20be481ec308b7892791',
                    'bs_abundance_98.tsv': 'e44d4ad64d333eff44a055b54939f4c9',
                    'bs_abundance_99.tsv': 'de385260f7a188acd56a1f553f62aa44',
                    'run_info.json': 'adfdcfd7130b3a9ce38d23b76136922f'},
            'wt1': {'abundance.h5': '67374ad88215387b8e400d906c33a11d',
                    'abundance.tsv': 'a920335482da4f89ae2865d46288cf83',
                    'bs_abundance_0.tsv': '96fc5d32d69c292527d0897cc2f57ae8',
                    'bs_abundance_1.tsv': 'e31212f1ed6ae7efc10cc7d6e8e07d13',
                    'bs_abundance_10.tsv': '4b7177330a73f06006bc574e0600a525',
                    'bs_abundance_11.tsv': '4e3c32c7922a3872fafc9f29c3972021',
                    'bs_abundance_12.tsv': '23e63f09f3c215e9219b6842eb447ecd',
                    'bs_abundance_13.tsv': '860da002d353c5687dbddfb123deb225',
                    'bs_abundance_14.tsv': '58df6c57907fee1c0cb941c8a1a92433',
                    'bs_abundance_15.tsv': '4857568dfb7d1e3f3ed0c17fcbbe25c4',
                    'bs_abundance_16.tsv': '7b3c4595eaea03c8ae78ea1b97a4ec86',
                    'bs_abundance_17.tsv': 'd66694de5eb375bcdf1589fd5d6bf420',
                    'bs_abundance_18.tsv': '166789d723715d90f2a5dea0a7d8fdd0',
                    'bs_abundance_19.tsv': 'd7598fb27d0e4dafdc389c03e778ce8e',
                    'bs_abundance_2.tsv': '88bb15c2e1a0a9edd5ef1dc253d553db',
                    'bs_abundance_20.tsv': '19af541ae9c6bdfa1c5f8a064a4dc3b7',
                    'bs_abundance_21.tsv': 'aa951d6eb7753a5d74bdd6c69da78278',
                    'bs_abundance_22.tsv': '3b26a637f60112a0a98241b4a9cfd0de',
                    'bs_abundance_23.tsv': 'e4dcc0ecf9bdb8a99a2db59d2b4ba5b8',
                    'bs_abundance_24.tsv': '47513e39938673fbd20a0a13acd33510',
                    'bs_abundance_25.tsv': 'e89c6465f65c40d20f1b2b5de1a7581d',
                    'bs_abundance_26.tsv': '83a58c15826961ec251b742e35380bdf',
                    'bs_abundance_27.tsv': 'a7e87373c0a6a8f9d345493d73940802',
                    'bs_abundance_28.tsv': '9da4a17054065a0c42b0ee56c368d800',
                    'bs_abundance_29.tsv': 'faed0e037caec85e2b01893dfe657d97',
                    'bs_abundance_3.tsv': '72181c51ad10456ccd580ee29323eea5',
                    'bs_abundance_30.tsv': 'e0c5a4f96af92d1b71a75e63d6e581ea',
                    'bs_abundance_31.tsv': '4cd8f1a3d390a8f1ccb6b6402d907fe5',
                    'bs_abundance_32.tsv': '3977d9f86f92551a60ce9c9fe3a14af5',
                    'bs_abundance_33.tsv': '18ab770b77d3051a4ae492d80e37534b',
                    'bs_abundance_34.tsv': '67835db906b74d9f48204b1cfd9a4a03',
                    'bs_abundance_35.tsv': '73c86ff7494b06154e3ad3e22fb6a4e1',
                    'bs_abundance_36.tsv': '0b5b1ef90ad518907fc633a78b0de55d',
                    'bs_abundance_37.tsv': 'fcf28eeecdb12e126fe29c949d28061f',
                    'bs_abundance_38.tsv': 'a6ecd516c776b8758cdd9919fd8f0490',
                    'bs_abundance_39.tsv': '9481dc802ae167422444eb4a07a61b12',
                    'bs_abundance_4.tsv': '9dd2946ebf6b6d8535b544a746ba4e55',
                    'bs_abundance_40.tsv': '13cc784de3d78953381f6915fbc94210',
                    'bs_abundance_41.tsv': '8e70e46e1c0d92073b9dbaf1d1703800',
                    'bs_abundance_42.tsv': '0202cfc68e20785afe9e36e09f621d39',
                    'bs_abundance_43.tsv': '5faab1cd70583b0fd57314ce0863e3d0',
                    'bs_abundance_44.tsv': '6624c3b4409c48963454d6232b71f655',
                    'bs_abundance_45.tsv': '92b7fa4ee8081b46ec625341e68b1a3b',
                    'bs_abundance_46.tsv': '99aa2272c8248f75ef0b3258835fc651',
                    'bs_abundance_47.tsv': '255f563c31e56e821e5cfc0b655e57f0',
                    'bs_abundance_48.tsv': '3fc863b291a362c36fefff5ce39f3894',
                    'bs_abundance_49.tsv': '564df28a3a7611bde16c07762b25cc00',
                    'bs_abundance_5.tsv': '469c1a4d6e39a1c3f4a424029cb16118',
                    'bs_abundance_50.tsv': 'd70b23ee8203128ee4c6e478444e74ef',
                    'bs_abundance_51.tsv': '247869513215384686e3350148d1d631',
                    'bs_abundance_52.tsv': '3a699c60147c4d55308f9a89ccd81c37',
                    'bs_abundance_53.tsv': 'ed71663caece1b8cb70c3a34980af07a',
                    'bs_abundance_54.tsv': 'a1e078adb75288e6511a738fd26aac11',
                    'bs_abundance_55.tsv': '39b0c66b8834147065ae50e92b71910f',
                    'bs_abundance_56.tsv': 'fb6c02ede906ee95c1fe8722d2c64e39',
                    'bs_abundance_57.tsv': '954b8e6b74bf5da93e8015a3adf499bc',
                    'bs_abundance_58.tsv': '88c06d7b7435730d6b173a7ad6e80027',
                    'bs_abundance_59.tsv': '9468f789071ae4f255de469acf01cf15',
                    'bs_abundance_6.tsv': 'fd6317422b1da424e0b7f776dc29f54e',
                    'bs_abundance_60.tsv': '7700cab0b26f3ad81c41a9c020d3213e',
                    'bs_abundance_61.tsv': '4cf82ff6233ed3a2496d1c3c2e421da3',
                    'bs_abundance_62.tsv': '7e04fa0ad67365bc18e3dace56db3d9e',
                    'bs_abundance_63.tsv': '671b8054884cf6aea652701ed5d99e4e',
                    'bs_abundance_64.tsv': '905a3e2022512f8edb7553af77833270',
                    'bs_abundance_65.tsv': 'cf2e8e27264b31426ef405a2183c1403',
                    'bs_abundance_66.tsv': 'd65741a01e1969f3f12884d8b6b34201',
                    'bs_abundance_67.tsv': 'c49f8010856327eb5a95fb37583daac9',
                    'bs_abundance_68.tsv': '10b83ae2d50be6d9d4e8dac9087b277f',
                    'bs_abundance_69.tsv': 'd51b5e56e968e976b69502dc4ea2a6cb',
                    'bs_abundance_7.tsv': '88edd50cb06592b4888104aac9cc71ff',
                    'bs_abundance_70.tsv': '06a20f14f33bb79625031c65c87ffeac',
                    'bs_abundance_71.tsv': '393dd8e009842cc60263b0c0b5c27bae',
                    'bs_abundance_72.tsv': 'c6effd347964890cff3424d389c84118',
                    'bs_abundance_73.tsv': 'd5e92c285952be755e362eb8ef57da75',
                    'bs_abundance_74.tsv': '4b677adf2c1562b287b9d11977faf06f',
                    'bs_abundance_75.tsv': '82f69f07084cdff2cbf62ec21d064fca',
                    'bs_abundance_76.tsv': '2c39741d7f16da49ffb48e39666ac025',
                    'bs_abundance_77.tsv': '27ea383329683911fe43774f1d03d146',
                    'bs_abundance_78.tsv': '77fe28b15c7d3778cc19a8fb04ef4185',
                    'bs_abundance_79.tsv': '13785b16fc4312816e909b1c50473f4f',
                    'bs_abundance_8.tsv': 'eca744e67f137aa23c1bc58cb2149a37',
                    'bs_abundance_80.tsv': 'c0f510bb96ad29ca192c72a2a696f335',
                    'bs_abundance_81.tsv': 'b9a4725319e47e74942e01e99352d707',
                    'bs_abundance_82.tsv': '63cabd75732856fb5fef84fe287d2417',
                    'bs_abundance_83.tsv': '811dd40341d8a9260e9dbcbf6a98d6b8',
                    'bs_abundance_84.tsv': 'a5be8d2c78ad597ca64af3f022dc5eda',
                    'bs_abundance_85.tsv': 'a18a28209a3f2a89dab22d04834657a8',
                    'bs_abundance_86.tsv': 'cf8641f470badc5d9f042f92462602a5',
                    'bs_abundance_87.tsv': '0b7317f5f4640fa3750a2cc220e5faae',
                    'bs_abundance_88.tsv': 'a95eefd9131f8f70873f938c301b0c16',
                    'bs_abundance_89.tsv': '3d881a72f9a4b8778f7d624e76c3c874',
                    'bs_abundance_9.tsv': 'ed5c275dc08529a9c0ddbf7030a77209',
                    'bs_abundance_90.tsv': '3f41e205cb8ecf63bc6f5c2469d75e7e',
                    'bs_abundance_91.tsv': 'b6a2133ac23eb060c71451748ab754d3',
                    'bs_abundance_92.tsv': '038b732a2179c1573f2c2fa4ad785daa',
                    'bs_abundance_93.tsv': '12e76d073f5d1b91ae9d21ebf40bd450',
                    'bs_abundance_94.tsv': 'b0be763b46da7fdaae99910377895582',
                    'bs_abundance_95.tsv': '9d3214afae1ae645eafe9bbfd6d80af3',
                    'bs_abundance_96.tsv': '4f9f43d88694acc7c353212527b3fde6',
                    'bs_abundance_97.tsv': '91fc42c6f1523431dae8b606e5d04920',
                    'bs_abundance_98.tsv': 'cab22fd16259a30b63fcae4caa032bbb',
                    'bs_abundance_99.tsv': 'fbca271c5ef039cb100d9f42620d27f9',
                    'run_info.json': '0035a7317254484ae13e4abbc94cc195'},
            'wt2': {'abundance.h5': 'e232795f2976fd6d6664d8ab8c9538b1',
                    'abundance.tsv': 'b69782d52210778f8a9a0a816ce43844',
                    'bs_abundance_0.tsv': 'ed4894029dcfe76a646aeeab95843950',
                    'bs_abundance_1.tsv': '987d1c134478b0ef1d6506448e395c4e',
                    'bs_abundance_10.tsv': 'ff4614a4b1ca9caae165a19e88aaa267',
                    'bs_abundance_11.tsv': '4f5cf41b665fdb79790786dc5a497e18',
                    'bs_abundance_12.tsv': '20270c0212ae9eaad109fc2dc5872722',
                    'bs_abundance_13.tsv': '7946ad9f0c9046bc14008d521c52e689',
                    'bs_abundance_14.tsv': '0095a3db660828ed8a4c34cc9a5309f7',
                    'bs_abundance_15.tsv': '8fce133c733c4a43581b4282898db681',
                    'bs_abundance_16.tsv': 'd1c094d4054f0b90454b9b90839ad7c5',
                    'bs_abundance_17.tsv': 'f709588b588a99be3502677b35e9b2c9',
                    'bs_abundance_18.tsv': 'd81cf0139d8ceb7e1fff85a9cbc37609',
                    'bs_abundance_19.tsv': '5ac8c1ce44223000fe79a48c7df60c73',
                    'bs_abundance_2.tsv': 'eb67249119b99f27a28e1f291785d14b',
                    'bs_abundance_20.tsv': 'cb32d8d89b69340f0d5b9eb22e27db3b',
                    'bs_abundance_21.tsv': 'd373042c398e5015eda7d7ec310348fb',
                    'bs_abundance_22.tsv': '3d14fdd3921a3cb1c8bf21c3bb0d3b31',
                    'bs_abundance_23.tsv': 'b6b45b3f3d7977cab9dc1701852ff592',
                    'bs_abundance_24.tsv': '97384ac2bb272bbe2b1922b1aaf226fb',
                    'bs_abundance_25.tsv': '1eecc3c00f613078f032490b48dffc2e',
                    'bs_abundance_26.tsv': '6cfcbd608be62a59a375a8ac6aa59390',
                    'bs_abundance_27.tsv': '26b175c77e7b5af09f8e4a606c87d5d1',
                    'bs_abundance_28.tsv': '498de67366eed1a737379b8c1f257929',
                    'bs_abundance_29.tsv': '4c0f837a126bc337456a3029611ba031',
                    'bs_abundance_3.tsv': '98a0c4ab81f5848074a283f2eedb873c',
                    'bs_abundance_30.tsv': '9a28a38dd946a1ac9faaea36724ed09c',
                    'bs_abundance_31.tsv': 'f70b195934610cbe465b659a096e8b55',
                    'bs_abundance_32.tsv': 'f0561d89cedf474274c90f9bfeba0249',
                    'bs_abundance_33.tsv': '2cdd2803925658f76d1d2be355d7945e',
                    'bs_abundance_34.tsv': 'be019e8bb9e27873c6eaf8175c6ec207',
                    'bs_abundance_35.tsv': 'b4d0ebc436c63f18bd62eebc30b574d7',
                    'bs_abundance_36.tsv': 'c30f08d0897ee79aa1e2749817c5f0a8',
                    'bs_abundance_37.tsv': '6e7ccff28324de078d1e520abbcde663',
                    'bs_abundance_38.tsv': 'a018c8fd11c4f961be7b5e7519d2d962',
                    'bs_abundance_39.tsv': 'ed11c0eea19ddb50c46c5b521ba87250',
                    'bs_abundance_4.tsv': 'bc61d9ec794df6485ead6a524779f971',
                    'bs_abundance_40.tsv': '03c716d0fa7332bc64ca7bcf08c7e5d0',
                    'bs_abundance_41.tsv': 'b46068257fb113085fbc317bac7f41e3',
                    'bs_abundance_42.tsv': '032a399e837838175e123d46d08d64ad',
                    'bs_abundance_43.tsv': '70a0e9c95b681ff62c4dc10c9f6a5c15',
                    'bs_abundance_44.tsv': 'e9669160334ffa2d6647f6a52a807483',
                    'bs_abundance_45.tsv': 'af3d478835d4ea545cae011d61f30741',
                    'bs_abundance_46.tsv': '72d733ea8f39e71e0674332ce2bbddae',
                    'bs_abundance_47.tsv': 'f9d0a68be163da5babe834d1c93c2f83',
                    'bs_abundance_48.tsv': '684aa0c30b11db2c22682c3677b82c3e',
                    'bs_abundance_49.tsv': '76e50ba661471e87fa37fe5196bdfc94',
                    'bs_abundance_5.tsv': '6bd8872e70a406e20d49c9f1b213f888',
                    'bs_abundance_50.tsv': 'd596f108ff9e392510c1505eae843ee6',
                    'bs_abundance_51.tsv': '18545ba91700bf560b2b86bacc844b10',
                    'bs_abundance_52.tsv': 'd8d4d60382c5e86acf45954a08540dd9',
                    'bs_abundance_53.tsv': '244896eb6d87bd94497e81e6a8696e85',
                    'bs_abundance_54.tsv': 'b4a51f105162b0061f8ac5a8927bf5dd',
                    'bs_abundance_55.tsv': 'c2aa7b78f0cd2a4b50350c43b1de071d',
                    'bs_abundance_56.tsv': '33844b313fed41bfa47d40a7b193bdd3',
                    'bs_abundance_57.tsv': 'caec566444decb89212e405854c29a14',
                    'bs_abundance_58.tsv': '98ead4ccca5fcf286e82b199f6cb59a5',
                    'bs_abundance_59.tsv': '250d19d073623f6a8ac9282343db93b1',
                    'bs_abundance_6.tsv': '8e1e340b446ea3081057fc460f59d900',
                    'bs_abundance_60.tsv': '05a8f7e8b1b40bd24470a9b15a717c26',
                    'bs_abundance_61.tsv': '3ee1520b3e68a2924eb4ea2aa03f59c3',
                    'bs_abundance_62.tsv': 'c1166e4b4b049af8d5e0aab935b31175',
                    'bs_abundance_63.tsv': 'ea3280d17d0746a3e999cc2cc8efdd3d',
                    'bs_abundance_64.tsv': 'fdbb2b8fd40f346cb2f3c3349b986d09',
                    'bs_abundance_65.tsv': 'b09401de9864515f07740ff76337a702',
                    'bs_abundance_66.tsv': '6e08bc60fa7e1678255f6b531e95cefa',
                    'bs_abundance_67.tsv': 'd222ac0c6804ead152d43e4498ad5699',
                    'bs_abundance_68.tsv': '87a8ca3f518ceac065d0649a3d1d4c7f',
                    'bs_abundance_69.tsv': '700efa44598d2a57b5eac7e75d7a3e20',
                    'bs_abundance_7.tsv': '81c428347d44b17c3e1ff435d29bd6e9',
                    'bs_abundance_70.tsv': '37a56b19a1353c3c3ff987c8313fa987',
                    'bs_abundance_71.tsv': '324d4c7dc6fb60d6ea0457f531678599',
                    'bs_abundance_72.tsv': 'b14aafc7dc83d7e4c75aa15fdc647d58',
                    'bs_abundance_73.tsv': '2b89bc39dd9d897c83ba3c81449f31f8',
                    'bs_abundance_74.tsv': '3fc2a89cd099fee4cc449390d384cf29',
                    'bs_abundance_75.tsv': '6bf44b2885854061888bb364208b8402',
                    'bs_abundance_76.tsv': 'c67ec79159ba5945ab5181902d32b005',
                    'bs_abundance_77.tsv': '1397dedf00c6b6c41cfa38dcd801f2a1',
                    'bs_abundance_78.tsv': 'd808ce2dc0461a596c03517b67d79284',
                    'bs_abundance_79.tsv': 'e3f19a4161f755f7a460206a908dee87',
                    'bs_abundance_8.tsv': '34ad9d78ee95754ddea0ad6535dc1df6',
                    'bs_abundance_80.tsv': '31e6140be25d8c741d89680a5d563f72',
                    'bs_abundance_81.tsv': 'c3a429a42fbad7c0835663174dc4519d',
                    'bs_abundance_82.tsv': '6c3305a08bbc7060cbde7efb6c901e54',
                    'bs_abundance_83.tsv': 'cf6d4b0086f391900c03a5284e1a75c3',
                    'bs_abundance_84.tsv': 'df87fbf8958d7c892cf0a88fa03cef0d',
                    'bs_abundance_85.tsv': '36a23b4d1c5dcb84a07168d62374f4e5',
                    'bs_abundance_86.tsv': '43a9bc6d30ae73d747b3e2bf38ca6bcc',
                    'bs_abundance_87.tsv': 'ec998fd68ab3805916531231a737ce14',
                    'bs_abundance_88.tsv': 'bf4f1e021c6f7660963cd8a973b4ebff',
                    'bs_abundance_89.tsv': 'f5e319974878e6d38c5c2ce01f4e7256',
                    'bs_abundance_9.tsv': 'dc7e0105eb37fbea3ce33472913ce379',
                    'bs_abundance_90.tsv': 'a237b6e87348de02c5afc164e509e6d0',
                    'bs_abundance_91.tsv': 'af23e932f3d82e3d67afd1cebfb50a37',
                    'bs_abundance_92.tsv': '7e7465582f48f1079a137e3f17d5250b',
                    'bs_abundance_93.tsv': '97838e5495c7279ef48d1e2f7881079c',
                    'bs_abundance_94.tsv': '69bd3c162deed5676dd3d225a46f3307',
                    'bs_abundance_95.tsv': 'c3bae60f126c12a9ee151df939c1660d',
                    'bs_abundance_96.tsv': 'e11b4fbde94a9d64548aea8314ada51b',
                    'bs_abundance_97.tsv': '442605a6f7d25e71664c8b6c026321e0',
                    'bs_abundance_98.tsv': 'b607723410c2bed4eb002f33741053b5',
                    'bs_abundance_99.tsv': '54a1593945a6da7d3d37d6cb2614ec42',
                    'run_info.json': 'ad2ba0be4210ad8ab9238a4817bc0308'}
}

    new_md5s = {}
    for root, dirs, files in os.walk('../../test_samples/aligned/'):
        if not len(files) == 0:
            folder = root.split('/')[-1]
            new_md5s[folder] = {}

            for fname in files:
                md5 = md5_chksum('{}/{}'.format(root, fname))
                print('{}: {}'.format(fname, md5))
                new_md5s[folder][fname] = md5

    assert md5s == new_md5s, 'MD5\'s do not match those in record!.'

    for _id in ids:
        



def read_quant(_id):
    result = subprocess.check_output(['../../Request.sh', 'read_quant', '--id', _id])
    result = result.decode('utf-8').strip()

def copy_reads_folder(_id):
    os.rmdir('../../root/projects/{}/0_raw_reads'.format(_id))
    shutil.copytree('../../test_samples/raw/minimum', '../../root/projects/{}/0_raw_reads/'.format(_id))

def copy_reads_archive(_id):
    shutil.copy2('../../test_samples/raw/minimum.tar.gz', '../../root/projects/{}/0_raw_reads/minimum.tar.gz'.format(_id))

def copy_reads_multiple(_id):
    os.rmdir('../../root/projects/{}/0_raw_reads'.format(_id))
    shutil.copytree('../../test_samples/raw/multiple', '../../root/projects/{}/0_raw_reads/'.format(_id))

def test_unpacking(testn):
    md5s = {'18844_CCGTCC_L001_R1_001aa.fastq.gz': 'd4eb3295777b6556988f772158f6eaee',
            '18844_CCGTCC_L001_R1_002aa.fastq.gz': 'be800e0e845f528aef13a2427db9c28c',
            '18844_CCGTCC_L001_R1_003aa.fastq.gz': '71b355c1d54ac7c15513fca4a5d09dcc',
            '18844_CCGTCC_L002_R1_001aa.fastq.gz': '6d13e0c1844339fcb73f6efd321435ba',
            '18844_CCGTCC_L002_R1_002aa.fastq.gz': 'fb42a29875358fda7bc9a3fbb1b26db6',
            '18844_CCGTCC_L002_R1_003aa.fastq.gz': '006e33f74303d076b0e0dcb6d0563352',
            '18845_GTCCGC_L001_R1_001aa.fastq.gz': '2cd48438b23f51a2807dd8173d022dd6',
            '18845_GTCCGC_L001_R1_002aa.fastq.gz': '6356c494452e44696c66436bd437f473',
            '18845_GTCCGC_L001_R1_003aa.fastq.gz': '9797c44857a9ed9b9540d0fd87bbfdf2',
            '18845_GTCCGC_L002_R1_001aa.fastq.gz': 'aacca6b59e419e9814985aa44a0c76bb',
            '18845_GTCCGC_L002_R1_002aa.fastq.gz': '9395e721461d3bb91a9945bfe77c17d1',
            '18845_GTCCGC_L002_R1_003aa.fastq.gz': '63ad9c405c181ea74bdaf78ec85f7ed6',
            '18841_AGTCAA_L001_R1_001aa.fastq.gz': '1e84587cf4d07cf3f9945656765f50aa',
            '18841_AGTCAA_L001_R1_002aa.fastq.gz': '34f2ee199d90250019cde457f7f3af3b',
            '18841_AGTCAA_L001_R1_003aa.fastq.gz': 'cb9a4a1d4bd792d29a0d6d73834d83a4',
            '18841_AGTCAA_L002_R1_001aa.fastq.gz': '2d9b1c464bfabcea7fd021f0e07c60f6',
            '18841_AGTCAA_L002_R1_002aa.fastq.gz': '71b3aeb73a909292b7a65a9f2eea6131',
            '18841_AGTCAA_L002_R1_003aa.fastq.gz': 'e7403dd5536d9acf71065fc5ef9c89b1',
            '18842_AGTTCC_L001_R1_001aa.fastq.gz': '4467221cbd918be2c6799d3ecbd73113',
            '18842_AGTTCC_L001_R1_002aa.fastq.gz': '3679701aab7ae4ffe55ad8203813b284',
            '18842_AGTTCC_L001_R1_003aa.fastq.gz': '32eedc6587834a18005fa31984910217',
            '18842_AGTTCC_L002_R1_001aa.fastq.gz': '11b0a8f6c0e1e78907ef5d9c1513d93a',
            '18842_AGTTCC_L002_R1_002aa.fastq.gz': '811bf0c7dd01e13792285d4e82a57637',
            '18842_AGTTCC_L002_R1_003aa.fastq.gz': 'dc0b307190a6edabafe890e90c811aec'}

    # calculate md5s
    new_md5s = {}
    for root, dirs, files in os.walk('../../test_samples/raw/minimum'):
        for fname in files:
            md5 = md5_chksum('{}/{}'.format(root, fname))
            print('{}: {}'.format(fname, md5))
            new_md5s[fname] = md5

    assert md5s == new_md5s, 'MD5\'s do not match those in record!.'

    print('***Start unarchiving test***')

    projects = []
    for i in range(testn):
        print('**entire folder archived into one file {}***'.format(i))
        projects.append(unpacking_sequence(lambda x : copy_reads_archive(x)))

    for i in range(testn):
        print('***unarchived & divided into folders {}***'.format(i))
        projects.append(unpacking_sequence(lambda x : copy_reads_folder(x)))

    for i in range(testn):
        print('***multiple archives {}***'.format(i))
        projects.append(unpacking_sequence(lambda x : copy_reads_multiple(x)))

    return projcts

    def unpacking_sequence(copy):
        _id = new_proj()
        print('\tNew project: {}'.format(_id))
        copy(_id)
        print('\tInfer samples')
        result = infer_samples(_id, md5s)

        if result:
            print('\t{} passed the test'.format(_id))
        else:
            print('\t{} failed the test'.format(_id))

        return _id

def remove_proj(_id):
    shutil.rmtree('../../root/projects/{}'.format(_id))


def test_concurrency(workern, testn):

    def work(testn, qu):
        for i in range(testn):
            _id = new_proj()
            print('.', end='', flush=True)
            qu.put(_id)

    print('***concurrency***')

    projects = queue.Queue()
    threads = []
    for i in range(workern):
        t = Thread(target=work, args=(testn, projects,))
        t.setDaemon(True)
        threads.append(t)

    for t in threads:
        t.start()

    for t in threads:
        for i in range(testn):
            remove_proj(projects.get())

    print()

if __name__ == '__main__':
    # testn = 10
    # workern = 8
    # test_concurrency(workern, testn)
    # projects = test_unpacking(testn)
    #
    # for _id in projects:
    #     read_quant(_id)
    test_read_quant()




