import { StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";
import { observer } from "mobx-react";
import { savedIpsStore } from "@/store/SavedIps";
import { TableHeader } from "@/components/Table/TableHeader";
import { TableRows } from "@/components/Table/TableRows";
import { useTableHeader } from "@/hooks/useTableHeader";
import { initialTestPageTableHeaderCols, MyTableHeaderColumn } from "../TestRunScreen/model";
import { miniStyle } from "@/theme";
import { Button, IconButton } from "react-native-paper";
import { AppI18n } from "@/localize";
import { RootTabScreenProps } from "@/types";

const SavedIpsScreen = observer(({ navigation }: RootTabScreenProps<"SavedIps">) => {
  const { tableHeaders, onSort } = useTableHeader<MyTableHeaderColumn>(
    initialTestPageTableHeaderCols
  );

  const onImport = () => {
    const ipList = savedIpsStore.savedIpList.map((item) => item.ip);
    navigation.navigate("TestRun", { importIps: ipList });
  };

  const onClear = () => {
    savedIpsStore.clear();
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Button
          onPress={onImport}
          mode="contained"
          contentStyle={{ ...styles.paperBtnContent }}
          labelStyle={{ ...miniStyle.textStyle }}
        >
          {AppI18n.t("savedIps.importToTest")}
        </Button>
        <View style={{ marginRight: 10 }} />
        <Button
          onPress={onClear}
          mode="outlined"
          contentStyle={{ ...styles.paperBtnContent }}
          labelStyle={{ ...miniStyle.textStyle }}
        >
          {AppI18n.t("savedIps.clear")}
        </Button>
      </View>

      <TableHeader
        onSort={() => {}} // Sorting not implemented for simplicity here
        cols={tableHeaders}
        style={{ cellTextStyle: miniStyle.textStyle }}
      />

      <TableRows
        rows={savedIpsStore.savedIpList}
        columns={tableHeaders.map((col) => {
          if (col.id === "action") {
            return {
              ...col,
              formatter: (row: any) => (
                <IconButton
                  icon="delete"
                  size={16}
                  onPress={() => savedIpsStore.removeSavedIp(row.ip)}
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

export default SavedIpsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 10,
  },
  toolbar: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  paperBtnContent: { marginHorizontal: -10, marginVertical: -2 },
});
