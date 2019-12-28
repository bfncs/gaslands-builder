import React from "react";
import {
  Button,
  ButtonGroup,
  Card,
  HTMLTable,
  Icon,
  Intent,
  Menu,
  Popover,
  Position,
  Tab,
  Tabs,
  Tag
} from "@blueprintjs/core";
import {
  ActiveVehicle,
  calculateBuildSlotsInUse,
  calculateHandling,
  calculateMaxGear,
  calculateTotalCost,
  calculateTotalCrew,
  calculateTotalHull
} from "./rules/vehicles";
import styles from "./VehicleCard.module.css";
import {
  ActiveWeapon,
  calculateActiveWeaponCost,
  getNextFacing,
  WeaponFacing,
  weaponTypes
} from "./rules/weapons";
import { assertNever } from "assert-never";
import {
  ActiveVehicleUpgrade,
  calculateUpgradeQuantityLimit,
  VehicleUpgrade,
  vehicleUpgrades
} from "./rules/vehicleUpgrades";

interface VehicleCardProps {
  vehicle: ActiveVehicle;
  onUpdate: (vehicle: ActiveVehicle) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

function buildTabTitle(title: string, items: Array<Object>): string {
  if (!items || items.length === 0) {
    return title;
  }

  return `${title} (${items.length})`;
}

function buildArcOfFireIcon(facing: WeaponFacing): React.ReactNode {
  switch (facing.direction) {
    case "front":
      return <Icon icon="arrow-up" title="front" />;
    case "rear":
      return <Icon icon="arrow-down" title="rear" />;
    case "side":
      return <Icon icon="arrows-horizontal" title="sides" />;
    case "360°":
      return (
        <Icon
          icon={"circle"}
          intent={
            facing.type === "WeaponFacingUserSelected" ? "success" : "none"
          }
          title={
            facing.type === "WeaponFacingUserSelected"
              ? "Turret mounted for 3× price"
              : "360°"
          }
        />
      );
    default:
      assertNever(facing);
  }
}

interface VehiclePropertyTagProps {
  value: string | number;
  label?: string;
  intent?: Intent;
}
const VehiclePropertyTag: React.FC<VehiclePropertyTagProps> = ({
  label,
  value,
  intent
}): React.ReactElement => (
  <div className={styles.propertyTag} key={(label || "") + value}>
    <Tag intent={intent}>{label ? `${label}: ${value}` : value}</Tag>
  </div>
);

function canUpgradeBeAddedToVehicle(
  upgrade: VehicleUpgrade,
  vehicle: ActiveVehicle
): boolean {
  const usedUpgrade = vehicle.upgrades.find(({ type }) => type === upgrade);

  if (!usedUpgrade) {
    return true;
  }

  switch (upgrade.quantity) {
    case "single":
      return false;
    case "unlimited":
      return true;
    case "limited":
      return (
        usedUpgrade.amount < calculateUpgradeQuantityLimit(upgrade, vehicle)
      );
    default:
      assertNever(upgrade.quantity);
  }
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onUpdate,
  onDuplicate,
  onRemove
}): React.ReactElement => {
  const buildSlotsInUse = calculateBuildSlotsInUse(vehicle);
  return (
    <Card>
      <h2>{vehicle.type.name}</h2>
      <VehiclePropertyTag label="Cost" value={calculateTotalCost(vehicle)} />
      <VehiclePropertyTag
        label="Build Slots"
        value={
          buildSlotsInUse > 0
            ? `${buildSlotsInUse}/${vehicle.type.buildSlots}`
            : vehicle.type.buildSlots
        }
        intent={buildSlotsInUse > vehicle.type.buildSlots ? "danger" : "none"}
      />
      <VehiclePropertyTag label="Hull" value={calculateTotalHull(vehicle)} />
      <VehiclePropertyTag label="Handling" value={calculateHandling(vehicle)} />
      <VehiclePropertyTag label="Max. Gear" value={calculateMaxGear(vehicle)} />
      <VehiclePropertyTag label="Crew" value={calculateTotalCrew(vehicle)} />
      <VehiclePropertyTag value={vehicle.type.weight} />

      {vehicle.type.specialRule && (
        <div className={styles.specialRule}>{vehicle.type.specialRule}</div>
      )}

      <div className={styles.kitContainer}>
        <Tabs>
          <Tab
            id="weapons"
            title={buildTabTitle("Weapons", vehicle.weapons)}
            panel={
              <>
                <HTMLTable>
                  <thead>
                    <tr>
                      <td>
                        <Icon title="Weapon" icon="ninja" />
                      </td>
                      <td>
                        <Icon title="Arc of fire" icon="locate" />
                      </td>
                      <td>
                        <Icon title="Range" icon="arrows-horizontal" />
                      </td>
                      <td>
                        <Icon title="Attack Dice" icon="cube" />
                      </td>
                      <td>
                        <Icon title="Build Slots" icon="cog" />
                      </td>
                      <td>
                        <Icon title="Cost" icon="dollar" />
                      </td>
                      <td>&nbsp;</td>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicle.weapons.map(
                      ({ type, facing }: ActiveWeapon, index: number) => (
                        <tr key={type.abbreviation + index}>
                          <td>{type.name}</td>
                          <td>
                            {facing.type !== "WeaponFacingUserSelected" ? (
                              buildArcOfFireIcon(facing)
                            ) : (
                              <div
                                className={styles.actionIcon}
                                onClick={() => {
                                  onUpdate({
                                    ...vehicle,
                                    weapons: vehicle.weapons.map((w, i) => {
                                      if (i !== index) {
                                        return w;
                                      }
                                      return {
                                        type: w.type,
                                        facing: getNextFacing(w.facing)
                                      };
                                    })
                                  });
                                }}
                              >
                                {buildArcOfFireIcon(facing)}
                              </div>
                            )}
                          </td>
                          <td title="Range">{type.range}</td>
                          <td title="Attack Dice">{type.attackDice}D6</td>
                          <td title="Build Slots">{type.buildSlots}</td>
                          <td title="Cost">
                            {calculateActiveWeaponCost({ type, facing })}
                          </td>
                          <td>
                            {!type.isDefault && (
                              <Icon
                                className={styles.actionIcon}
                                icon="delete"
                                onClick={() => {
                                  onUpdate({
                                    ...vehicle,
                                    weapons: vehicle.weapons.filter(
                                      (v, i) => i !== index
                                    )
                                  });
                                }}
                              />
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </HTMLTable>
                <Popover
                  content={
                    <Menu>
                      {weaponTypes
                        .filter(weapon => !weapon.isDefault)
                        .map(weapon => (
                          <Menu.Item
                            key={weapon.name}
                            text={weapon.name}
                            onClick={() =>
                              onUpdate({
                                ...vehicle,
                                weapons: [
                                  ...vehicle.weapons,
                                  {
                                    type: weapon,
                                    facing: weapon.isCrewFired
                                      ? {
                                          type: "WeaponFacingCrewFired",
                                          direction: "360°"
                                        }
                                      : {
                                          type: "WeaponFacingUserSelected",
                                          direction: "front"
                                        }
                                  }
                                ]
                              })
                            }
                          ></Menu.Item>
                        ))}
                    </Menu>
                  }
                  position={Position.BOTTOM}
                  minimal
                >
                  <Button icon="add">Add Weapon</Button>
                </Popover>
              </>
            }
          ></Tab>
          <Tab
            id="upgrade"
            title={buildTabTitle("Upgrades", vehicle.upgrades)}
            panel={
              <>
                {vehicle.upgrades.length > 0 && (
                  <HTMLTable>
                    <thead>
                      <tr>
                        <td>
                          <Icon title="Upgrade" icon="asterisk" />
                        </td>
                        <td>&nbsp;</td>
                        <td>
                          <Icon title="Build Slots" icon="cog" />
                        </td>
                        <td>
                          <Icon title="Cost" icon="dollar" />
                        </td>
                        <td>&nbsp;</td>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicle.upgrades.map(
                        ({ type, amount }, index: number) => (
                          <tr key={type.abbreviation + index}>
                            <td>
                              {type.name + (amount > 1 ? ` (${amount}×)` : "")}
                            </td>
                            <td>{type.description}</td>
                            <td title="Build Slots">{type.buildSlots}</td>
                            <td title="Cost">{type.cost}</td>
                            <td className={styles.tableCellControls}>
                              {type.quantity === "unlimited" ||
                              type.quantity === "limited" ? (
                                <>
                                  {(type.quantity === "unlimited" ||
                                    (type.quantity === "limited" &&
                                      amount <
                                        calculateUpgradeQuantityLimit(
                                          type,
                                          vehicle
                                        ))) && (
                                    <>
                                      <Icon
                                        className={styles.actionIcon}
                                        icon="add"
                                        title="Add"
                                        onClick={() => {
                                          onUpdate({
                                            ...vehicle,
                                            upgrades: vehicle.upgrades.map(u =>
                                              u.type === type
                                                ? {
                                                    type,
                                                    amount: u.amount + 1
                                                  }
                                                : u
                                            )
                                          });
                                        }}
                                      />
                                      <span>&nbsp;</span>
                                    </>
                                  )}
                                  <Icon
                                    className={styles.actionIcon}
                                    icon="remove"
                                    title="Remove"
                                    onClick={() => {
                                      onUpdate({
                                        ...vehicle,
                                        upgrades:
                                          amount > 1
                                            ? vehicle.upgrades.map(u =>
                                                u.type === type
                                                  ? {
                                                      type,
                                                      amount: u.amount - 1
                                                    }
                                                  : u
                                              )
                                            : vehicle.upgrades.filter(
                                                (v, i) => i !== index
                                              )
                                      });
                                    }}
                                  />
                                </>
                              ) : (
                                <Icon
                                  className={styles.actionIcon}
                                  icon="delete"
                                  title="Delete"
                                  onClick={() => {
                                    onUpdate({
                                      ...vehicle,
                                      upgrades: vehicle.upgrades.filter(
                                        (v, i) => i !== index
                                      )
                                    });
                                  }}
                                />
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </HTMLTable>
                )}
                <Popover
                  content={
                    <Menu>
                      {vehicleUpgrades.map(upgrade => (
                        <Menu.Item
                          key={upgrade.name}
                          text={upgrade.name}
                          disabled={
                            !canUpgradeBeAddedToVehicle(upgrade, vehicle)
                          }
                          onClick={() => {
                            const currentUpgrade = vehicle.upgrades.find(
                              u => u.type === upgrade
                            );
                            const upgrades: ActiveVehicleUpgrade[] = currentUpgrade
                              ? vehicle.upgrades.map(({ type, amount }) =>
                                  type === upgrade
                                    ? { type, amount: amount + 1 }
                                    : { type, amount }
                                )
                              : [
                                  ...vehicle.upgrades,
                                  { type: upgrade, amount: 1 }
                                ];
                            onUpdate({
                              ...vehicle,
                              upgrades
                            });
                          }}
                        ></Menu.Item>
                      ))}
                    </Menu>
                  }
                  position={Position.BOTTOM}
                  minimal
                >
                  <Button icon="add">Add Upgrade</Button>
                </Popover>
              </>
            }
          ></Tab>
          <Tab
            id="perks"
            title="Perks"
            panel={
              <>
                <Button icon="add">Add Perk</Button>
              </>
            }
          ></Tab>
        </Tabs>
      </div>

      <ButtonGroup>
        <Button icon="remove" onClick={onRemove}>
          Remove
        </Button>
        <Button icon="duplicate" onClick={onDuplicate}>
          Duplicate
        </Button>
      </ButtonGroup>
    </Card>
  );
};

export default VehicleCard;
