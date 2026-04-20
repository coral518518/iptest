import { StyleSheet } from "react-native";
import { Text, TextInput, View } from "@/components/Themed";
import { useEffect, useState } from "react";
import { responseTestService } from "@/services/ResponseTest.service";
import { downloadTestService } from "@/services/DownloadTest.service";
import { TableHeader } from "@/components/Table/TableHeader";
import { useTableHeader } from "@/hooks/useTableHeader";
import { useTableData } from "../hooks/useTableData";
import { useTestIpCount } from "../hooks/useTestIpCount";
import { TableRows } from "@/components/Table/TableRows";
import { initialTestPageTableHeaderCols, MyTableHeaderColumn } from "../model";
import { useTestRunningStatus } from "../hooks/useTestRunningStatus";
import { miniStyle } from "@/theme";
import { Button, IconButton } from "react-native-paper";
import { AppI18n } from "@/localize";
import { userSettingsStore } from "@/store/UserSettings";
import { savedIpsStore } from "@/store/SavedIps";
import { RequestStatus } from "@/typings";
import { observer } from "mobx-react";
import { RootTabScreenProps } from "@/types";

const TestPage = observer(({ path, navigation, route }: { path: string, navigation: any, route: any }) => {
  const { testIpCount, setTestIpCount, getIpList } = useTestIpCount();
  const [testIpCoCurrentCount, setTestIpCoCurrentCount] = useState<string>("5");
  const [pingUrl, setPingUrl] = useState<string>(userSettingsStore.userSetting.pingUrl);
  const [testUrl, setTestUrl] = useState<string>(
    // "http://cachefly.cachefly.net/200mb.test"
    // "http://v2ray.xianshenglu.xyz"
    // "http://ip.flares.cloud/img/l.webp"
    `https://speed.cloudflare.com/__down?bytes=${10 * 1024 * 1024}`
  );

  const {
    tableData,
    reset: resetTableData,
    sortTableData,
    startResponseSpeedTest,
    startDownloadSpeedTest,
    getSelectedIpList,
    initTableData,
  } = useTableData();

  const {
    tableHeaders,
    reset: resetTableHeader,
    changeTableHeadersSortType,
  } = useTableHeader<MyTableHeaderColumn>(initialTestPageTableHeaderCols);

  const { testRunningStatus, nextTestRunningStatus } = useTestRunningStatus();

  function onGenerate() {
    const newIpList = getIpList();
    initTableData(newIpList);
  }

  function onRunTest() {
    startResponseSpeedTest(
      getSelectedIpList(),
      Number(testIpCoCurrentCount),
      testUrl,
      pingUrl
    );
    startDownloadSpeedTest(
      getSelectedIpList(),
      Number(testIpCoCurrentCount),
      testUrl,
      pingUrl
    );
  }

  function onReset() {
    responseTestService.stop();
    downloadTestService.stop();
    resetTableData();
    resetTableHeader();
  }

  useEffect(() => {
    userSettingsStore.changeUserSettings({ pingUrl });
  }, [pingUrl]);

  useEffect(() => {
    if (route.params?.importIps) {
      initTableData(route.params.importIps);
      // clear params after import
      navigation.setParams({ importIps: null });
    }
  }, [route.params?.importIps]);

  function onSort(
    colId: MyTableHeaderColumn["id"],
    sortType: MyTableHeaderColumn["sort"]
  ) {
    changeTableHeadersSortType(colId, sortType);
    sortTableData(colId, sortType);
  }
  function onTestIpCountChange(v: string) {
    setTestIpCount(() => {
      return v;
    });
  }

  return (
    <View style={styles.getStartedContainer}>
      <View style={styles.toolbar}>
        <Button
          onPress={onGenerate}
          mode="contained"
          contentStyle={{ ...styles.paperBtnContent }}
          labelStyle={{ ...miniStyle.textStyle }}
        >
          {AppI18n.t("general.generate")}
        </Button>
        <View style={{ marginRight: 5 }}></View>

        <Button
          onPress={onRunTest}
          mode="contained"
          contentStyle={{ ...styles.paperBtnContent }}
          labelStyle={{ ...miniStyle.textStyle }}
        >
          {AppI18n.t("testRun.startTest")}
        </Button>

        <View style={{ marginRight: 5 }}></View>

        <Button
          onPress={onReset}
          mode="contained"
          contentStyle={{ ...styles.paperBtnContent }}
          labelStyle={{ ...miniStyle.textStyle }}
        >
          {AppI18n.t("general.reset")}
        </Button>
      </View>
      <View style={styles.toolbar}>
        <Text> {AppI18n.t("testRun.ipCount")}</Text>
        <TextInput
          style={styles.input}
          onChangeText={onTestIpCountChange}
          value={testIpCount}
          keyboardType="numeric"
        />
        <Text> {AppI18n.t("testRun.coCurrentCount")}</Text>
        <TextInput
          style={styles.input}
          onChangeText={(val) => setTestIpCoCurrentCount(() => val)}
          value={testIpCoCurrentCount}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.toolbar}>
        <Text>{AppI18n.t("testRun.testUrl")}</Text>
        <TextInput
          style={{ ...styles.input, flex: 1 }}
          onChangeText={(val) => setTestUrl(() => val)}
          value={testUrl}
        />
      </View>
      <View style={styles.toolbar}>
        <Text>{AppI18n.t("testRun.pingUrl")}</Text>
        <TextInput
          style={{ ...styles.input, flex: 1 }}
          onChangeText={(val) => setPingUrl(() => val)}
          value={pingUrl}
        />
      </View>

      <TableHeader
        onSort={onSort}
        cols={tableHeaders}
        style={{ cellTextStyle: miniStyle.textStyle }}
      />

      <TableRows
        rows={tableData}
        columns={tableHeaders.map((col) => {
          if (col.id === "action") {
            return {
              ...col,
              formatter: (row: any) => (
                <IconButton
                  icon="heart"
                  size={16}
                  onPress={() => savedIpsStore.addSavedIp(row)}
                  iconColor={savedIpsStore.savedIps[row.ip] ? "red" : "gray"}
                />
              ),
            };
          }
          return col;
        })}
        rowKeyName={"ip"}
        style={{ cellTextStyle: miniStyle.textStyle }}
      />
    </View>
  );
});

export default TestPage;

const styles = StyleSheet.create({
  getStartedContainer: {
    alignItems: "center",
    marginHorizontal: 10,
    marginVertical: 10,
    flexDirection: "column",
    alignSelf: "stretch",
    flex: 1,
  },
  input: {
    height: 40,
    borderWidth: 1,
    padding: 10,
    width: 60,
    marginHorizontal: 10,
  },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 10,
  },
  paperBtnContent: { marginHorizontal: -10, marginVertical: -2 },
});
